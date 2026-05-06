export type ThermalCategory =
  | 'very_hot'
  | 'hot'
  | 'warm'
  | 'slight_warm'
  | 'neutral'
  | 'slight_cool'
  | 'cool'
  | 'cold'
  | 'very_cold';

export type PETStandard = 'temperate' | 'tropical';

// Klasifikasi PET yang konsisten dengan pipeline (tanpa overlap boundary)
export function classifyPet(petValue: number, standard: PETStandard): ThermalCategory {
  const p = Number(petValue);
  if (!Number.isFinite(p)) return 'neutral';

  if (standard === 'temperate') {
    if (p > 41) return 'very_hot';
    if (p >= 35 && p <= 41) return 'hot';
    if (p >= 29 && p < 35) return 'warm';
    if (p >= 23 && p < 29) return 'slight_warm';
    if (p >= 18 && p < 23) return 'neutral';
    if (p >= 13 && p < 18) return 'slight_cool';
    if (p >= 8 && p < 13) return 'cool';
    if (p >= 4 && p < 8) return 'cold';
    return 'very_cold';
  }

  // tropical / sub_tropic
  if (p > 42) return 'very_hot';
  if (p >= 38 && p <= 42) return 'hot';
  if (p >= 34 && p < 38) return 'warm';
  if (p >= 30 && p < 34) return 'slight_warm';
  if (p >= 26 && p < 30) return 'neutral';
  if (p >= 22 && p < 26) return 'slight_cool';
  if (p >= 18 && p < 22) return 'cool';
  if (p >= 14 && p < 18) return 'cold';
  return 'very_cold';
}

export const PET_COLORS: Record<ThermalCategory, string> = {
  very_hot: '#800000',
  hot: '#ff0000',
  warm: '#ff8c00',
  slight_warm: '#f1c40f',
  neutral: '#2ecc71',
  slight_cool: '#00d2d3',
  cool: '#00a8ff',
  cold: '#3498db',
  very_cold: '#000080',
};

export const PET_RANGES: Record<
  PETStandard,
  Record<ThermalCategory, { min: number; max: number; label: string; labelId: string }>
> = {
  temperate: {
    very_hot: { min: 41, max: 999, label: 'Very Hot', labelId: 'Sangat Panas' },
    hot: { min: 35, max: 41, label: 'Hot', labelId: 'Panas' },
    warm: { min: 29, max: 35, label: 'Warm', labelId: 'Hangat' },
    slight_warm: { min: 23, max: 29, label: 'Slightly Warm', labelId: 'Agak Hangat' },
    neutral: { min: 18, max: 23, label: 'Neutral', labelId: 'Nyaman' },
    slight_cool: { min: 13, max: 18, label: 'Slightly Cool', labelId: 'Agak Sejuk' },
    cool: { min: 8, max: 13, label: 'Cool', labelId: 'Sejuk' },
    cold: { min: 4, max: 8, label: 'Cold', labelId: 'Dingin' },
    very_cold: { min: -999, max: 4, label: 'Very Cold', labelId: 'Sangat Dingin' },
  },
  tropical: {
    very_hot: { min: 42, max: 999, label: 'Very Hot', labelId: 'Sangat Panas' },
    hot: { min: 38, max: 42, label: 'Hot', labelId: 'Panas' },
    warm: { min: 34, max: 38, label: 'Warm', labelId: 'Hangat' },
    slight_warm: { min: 30, max: 34, label: 'Slightly Warm', labelId: 'Agak Hangat' },
    neutral: { min: 26, max: 30, label: 'Neutral', labelId: 'Nyaman' },
    slight_cool: { min: 22, max: 26, label: 'Slightly Cool', labelId: 'Agak Sejuk' },
    cool: { min: 18, max: 22, label: 'Cool', labelId: 'Sejuk' },
    cold: { min: 14, max: 18, label: 'Cold', labelId: 'Dingin' },
    very_cold: { min: -999, max: 14, label: 'Very Cold', labelId: 'Sangat Dingin' },
  },
};

