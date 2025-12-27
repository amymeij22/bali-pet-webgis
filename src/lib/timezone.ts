import { isSameDay } from 'date-fns';

const WITA_OFFSET_MINUTES = 8 * 60;
const MINUTE_IN_MS = 60 * 1000;

/**
 * Converts any date-like input to a Date that reflects UTC+8 (WITA) time when formatted
 * using the local timezone. This keeps displays consistent regardless of the viewer's zone.
 */
export function toWitaDate(input: string | number | Date): Date {
  const date = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  const shiftMinutes = WITA_OFFSET_MINUTES + date.getTimezoneOffset();
  return new Date(date.getTime() + shiftMinutes * MINUTE_IN_MS);
}

export function isSameWitaDay(a: string | number | Date, b: string | number | Date): boolean {
  return isSameDay(toWitaDate(a), toWitaDate(b));
}
