import type { WeatherForecast } from '@/data/supabaseQueries';

export const NEAREST_TOLERANCE_MS = 90 * 60 * 1000; // 90 menit
export const STEP_MS = 3 * 60 * 60 * 1000;

export function nearestForecast(
  list: WeatherForecast[],
  targetTime: string,
  toleranceMs: number = NEAREST_TOLERANCE_MS
): WeatherForecast | null {
  if (!list || list.length === 0) return null;
  const target = new Date(targetTime).getTime();
  if (!Number.isFinite(target)) return null;

  let lo = 0;
  let hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const tMid = new Date(list[mid].forecast_time).getTime();
    if (tMid === target) return list[mid];
    if (tMid < target) lo = mid + 1;
    else hi = mid - 1;
  }

  const cand: WeatherForecast[] = [];
  if (hi >= 0) cand.push(list[hi]);
  if (lo < list.length) cand.push(list[lo]);

  let best = cand[0];
  let bestDiff = Math.abs(new Date(best.forecast_time).getTime() - target);
  for (let i = 1; i < cand.length; i++) {
    const d = Math.abs(new Date(cand[i].forecast_time).getTime() - target);
    if (d < bestDiff) {
      best = cand[i];
      bestDiff = d;
    }
  }

  return bestDiff <= toleranceMs ? best : null;
}

export function buildSliderTimes(allForecasts: WeatherForecast[]): string[] {
  if (!allForecasts || allForecasts.length === 0) return [];

  const minByDest = new Map<string, number>();
  let maxT = -1;
  for (const f of allForecasts) {
    const t = new Date(f.forecast_time).getTime();
    if (!Number.isFinite(t)) continue;
    if (t > maxT) maxT = t;
    const prev = minByDest.get(f.destination_id);
    if (prev === undefined || t < prev) minByDest.set(f.destination_id, t);
  }
  if (maxT < 0 || minByDest.size === 0) return [];

  const uniqueStarts = Array.from(new Set(Array.from(minByDest.values()))).sort((a, b) => a - b);

  const out = new Set<number>();
  for (const s of uniqueStarts) {
    for (let t = s; t <= maxT + 1; t += STEP_MS) out.add(t);
  }

  return Array.from(out)
    .sort((a, b) => a - b)
    .map((t) => new Date(t).toISOString());
}

