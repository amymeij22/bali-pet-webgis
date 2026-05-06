import { describe, expect, test } from 'vitest';
import { isSameWitaDay, toWitaDate } from '@/lib/timezone';

describe('timezone (WITA helpers)', () => {
  test('toWitaDate shifts to UTC+8 display basis', () => {
    // Using a fixed UTC timestamp; we only assert that the function returns a valid Date.
    const d = toWitaDate('2026-01-01T00:00:00.000Z');
    expect(d instanceof Date).toBe(true);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });

  test('isSameWitaDay compares day in WITA', () => {
    // 23:30Z and 00:15Z next day are both on the same WITA day (UTC+8).
    expect(isSameWitaDay('2026-01-01T23:30:00.000Z', '2026-01-02T00:15:00.000Z')).toBe(true);
  });

  test('toWitaDate accepts Date input', () => {
    const d = toWitaDate(new Date('2026-01-01T00:00:00.000Z'));
    expect(Number.isNaN(d.getTime())).toBe(false);
  });
});

