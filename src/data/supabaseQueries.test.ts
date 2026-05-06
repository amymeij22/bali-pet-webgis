import { describe, expect, test, vi } from 'vitest';

// Minimal chainable query builder mock for supabase-js style calls
function makeSupabaseMock(result: { data: any; error: any }) {
  const q: any = {};
  const methods = [
    'from',
    'select',
    'eq',
    'order',
    'limit',
    'maybeSingle',
    'single',
    'upsert',
    'update',
  ];
  for (const m of methods) {
    q[m] = vi.fn(() => q);
  }
  // for non-terminal chains (select/order/etc) we treat call as returning {data,error}
  q.then = undefined;
  q.__result = result;

  // Allow awaiting the chain by providing a "then" at the end when used as a promise-like.
  // (We won't rely on this; we call the explicit terminal methods above.)
  return q;
}

const hoisted = vi.hoisted(() => ({
  mockQuery: makeSupabaseMock({ data: null, error: null }),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: hoisted.mockQuery,
}));

// after mock
import {
  getLatestBatch,
  getForecastTimes,
  getDestinationsWithVillage,
  getAllForecastsForBatch,
  savePushSubscription,
  removePushSubscription,
} from '@/data/supabaseQueries';

describe('supabaseQueries (production data layer)', () => {
  test('getLatestBatch returns null when no data', async () => {
    hoisted.mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await getLatestBatch();
    expect(res).toBeNull();
    expect(hoisted.mockQuery.from).toHaveBeenCalledWith('forecast_batches');
  });

  test('getForecastTimes returns unique ordered times', async () => {
    // this function awaits the chain result of order()
    hoisted.mockQuery.order.mockImplementationOnce(async () => ({
      data: [{ forecast_time: 't1' }, { forecast_time: 't1' }, { forecast_time: 't2' }],
      error: null,
    }));

    const times = await getForecastTimes('b1');
    expect(times).toEqual(['t1', 't2']);
  });

  test('getDestinationsWithVillage maps nested village metadata', async () => {
    hoisted.mockQuery.order.mockImplementationOnce(async () => ({
      data: [
        {
          id: 'd1',
          village_id: 'v1',
          destination_name: 'A',
          image_url: null,
          latitude: null,
          longitude: null,
          sea_level_height: null,
          created_at: 'c',
          updated_at: 'u',
          villages: { village_name: 'V', kdepum_code: 'K', regencies: { name: 'R' }, districts: { name: 'D' } },
        },
      ],
      error: null,
    }));

    const rows = await getDestinationsWithVillage();
    expect(rows[0]?.village_name).toBe('V');
    expect(rows[0]?.kdepum_code).toBe('K');
    expect(rows[0]?.regency).toBe('R');
    expect(rows[0]?.district).toBe('D');
  });

  test('getAllForecastsForBatch returns array', async () => {
    hoisted.mockQuery.order.mockImplementationOnce(async () => ({ data: [{ id: 'f1' }], error: null }));
    const rows = await getAllForecastsForBatch('b1');
    expect(rows.length).toBe(1);
  });

  test('savePushSubscription returns null on error, removePushSubscription returns false on error', async () => {
    hoisted.mockQuery.single.mockImplementationOnce(async () => ({ data: null, error: new Error('x') }));
    const saved = await savePushSubscription('e', 'p', 'a');
    expect(saved).toBeNull();

    hoisted.mockQuery.eq.mockImplementationOnce(async () => ({ error: new Error('x') }));
    const removed = await removePushSubscription('e');
    expect(removed).toBe(false);
  });
});

