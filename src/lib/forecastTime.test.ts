import { describe, expect, test } from 'vitest';
import { buildSliderTimes, nearestForecast } from '@/lib/forecastTime';
import type { WeatherForecast } from '@/data/supabaseQueries';

function wf(destination_id: string, forecast_time: string, pet_value: number): WeatherForecast {
  return {
    id: 'x',
    destination_id,
    batch_id: 'b',
    forecast_time,
    temperature: 0,
    humidity: 0,
    wind_speed: 0,
    wind_direction: 'N',
    weather_condition: 'Clear',
    visibility: '10 km',
    pet_value,
    temperate_thermal_category: null,
    sub_tropic_thermal_category: null,
  };
}

describe('nearestForecast', () => {
  test('returns null on empty list or invalid target', () => {
    expect(nearestForecast([], '2026-01-01T15:00:00.000Z')).toBeNull();
    const list = [wf('d1', '2026-01-01T15:00:00.000Z', 1)];
    expect(nearestForecast(list, 'not-a-date')).toBeNull();
  });

  test('returns exact match when target exists', () => {
    const list = [
      wf('d1', '2026-01-01T15:00:00.000Z', 1),
      wf('d1', '2026-01-01T18:00:00.000Z', 2),
    ];
    const nf = nearestForecast(list, '2026-01-01T18:00:00.000Z');
    expect(nf?.pet_value).toBe(2);
  });

  test('uses first/last candidate when target is outside range', () => {
    const list = [
      wf('d1', '2026-01-01T15:00:00.000Z', 1),
      wf('d1', '2026-01-01T18:00:00.000Z', 2),
    ];
    // before first -> choose first (within 90 min? set custom tolerance huge)
    const a = nearestForecast(list, '2026-01-01T14:00:00.000Z', 24 * 60 * 60 * 1000);
    expect(a?.forecast_time).toBe('2026-01-01T15:00:00.000Z');
    // after last -> choose last
    const b = nearestForecast(list, '2026-01-01T19:00:00.000Z', 24 * 60 * 60 * 1000);
    expect(b?.forecast_time).toBe('2026-01-01T18:00:00.000Z');
  });

  test('picks nearest within tolerance', () => {
    const list = [
      wf('d1', '2026-01-01T15:00:00.000Z', 1),
      wf('d1', '2026-01-01T18:00:00.000Z', 2),
    ];
    // target 16:00Z -> nearest 15:00Z within 90 minutes? (diff 60 min)
    const nf = nearestForecast(list, '2026-01-01T16:00:00.000Z');
    expect(nf?.forecast_time).toBe('2026-01-01T15:00:00.000Z');
  });

  test('returns null if outside tolerance', () => {
    const list = [wf('d1', '2026-01-01T15:00:00.000Z', 1)];
    const nf = nearestForecast(list, '2026-01-01T20:00:00.000Z');
    expect(nf).toBeNull();
  });

  test('picks the right-side candidate when it is closer', () => {
    const list = [
      wf('d1', '2026-01-01T15:00:00.000Z', 1),
      wf('d1', '2026-01-01T18:00:00.000Z', 2),
    ];
    // target 17:30Z -> nearest 18:00Z (diff 30 min)
    const nf = nearestForecast(list, '2026-01-01T17:30:00.000Z');
    expect(nf?.forecast_time).toBe('2026-01-01T18:00:00.000Z');
  });
});

describe('buildSliderTimes', () => {
  test('returns empty for empty input', () => {
    expect(buildSliderTimes([])).toEqual([]);
  });

  test('returns empty when no usable timestamps', () => {
    // invalid date should be skipped, resulting in empty
    const all = [wf('d1', 'invalid', 1)];
    expect(buildSliderTimes(all)).toEqual([]);
  });

  test('union of 3-hour sequences from unique earliest starts', () => {
    const all = [
      // dest 1 earliest 15:00, dest 2 earliest 16:00
      wf('d1', '2026-01-01T15:00:00.000Z', 1),
      wf('d1', '2026-01-01T18:00:00.000Z', 1),
      wf('d2', '2026-01-01T16:00:00.000Z', 1),
      wf('d2', '2026-01-01T19:00:00.000Z', 1),
    ];
    const times = buildSliderTimes(all);
    expect(times).toContain('2026-01-01T15:00:00.000Z');
    expect(times).toContain('2026-01-01T16:00:00.000Z');
    expect(times).toContain('2026-01-01T18:00:00.000Z');
    expect(times).toContain('2026-01-01T19:00:00.000Z');
  });
});

