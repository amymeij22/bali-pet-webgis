// Dummy data sesuai struktur database PRD

export interface Village {
  id: string;
  village_name: string;
  center: [number, number]; // [lng, lat]
}

export interface ForecastBatch {
  id: string;
  produced_at: string;
  is_latest: boolean;
  forecast_start: string;
  forecast_end: string;
}

export interface WeatherForecast {
  id: string;
  village_id: string;
  batch_id: string;
  forecast_time: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  weather_condition: string;
  visibility: string;
  pet_value: number;
  thermal_category: ThermalCategory;
  thermal_sensation_scale: number;
}

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

// PET color mapping sesuai PRD
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

// PET ranges for each standard
export const PET_RANGES: Record<PETStandard, Record<ThermalCategory, { min: number; max: number; label: string; labelId: string }>> = {
  temperate: {
    very_hot: { min: 41, max: 999, label: 'Very Hot', labelId: 'Sangat Panas' },
    hot: { min: 35, max: 41, label: 'Hot', labelId: 'Panas' },
    warm: { min: 29, max: 35, label: 'Warm', labelId: 'Hangat' },
    slight_warm: { min: 23, max: 29, label: 'Slightly Warm', labelId: 'Agak Hangat' },
    neutral: { min: 18, max: 23, label: 'Neutral', labelId: 'Nyaman' },
    slight_cool: { min: 13, max: 18, label: 'Slightly Cool', labelId: 'Agak Dingin' },
    cool: { min: 8, max: 13, label: 'Cool', labelId: 'Dingin' },
    cold: { min: 4, max: 8, label: 'Cold', labelId: 'Sangat Dingin' },
    very_cold: { min: -999, max: 4, label: 'Very Cold', labelId: 'Sangat Dingin Sekali' },
  },
  tropical: {
    very_hot: { min: 42, max: 999, label: 'Very Hot', labelId: 'Sangat Panas' },
    hot: { min: 38, max: 42, label: 'Hot', labelId: 'Panas' },
    warm: { min: 34, max: 38, label: 'Warm', labelId: 'Hangat' },
    slight_warm: { min: 30, max: 34, label: 'Slightly Warm', labelId: 'Agak Hangat' },
    neutral: { min: 26, max: 30, label: 'Neutral', labelId: 'Nyaman' },
    slight_cool: { min: 22, max: 26, label: 'Slightly Cool', labelId: 'Agak Dingin' },
    cool: { min: 18, max: 22, label: 'Cool', labelId: 'Dingin' },
    cold: { min: 14, max: 18, label: 'Cold', labelId: 'Sangat Dingin' },
    very_cold: { min: -999, max: 14, label: 'Very Cold', labelId: 'Sangat Dingin Sekali' },
  },
};

// Thermal sensation scale mapping
export const SENSATION_SCALE: Record<ThermalCategory, number> = {
  very_hot: 4,
  hot: 3,
  warm: 2,
  slight_warm: 1,
  neutral: 0,
  slight_cool: -1,
  cool: -2,
  cold: -3,
  very_cold: -4,
};

// Visitor notes sesuai PRD
export const VISITOR_NOTES: Record<ThermalCategory, string> = {
  very_hot: 'Gunakan sunscreen SPF 30+, topi lebar, dan hidrasi setiap 15-20 menit. Hindari aktivitas berat siang hari.',
  hot: 'Gunakan sunscreen SPF 30+, topi lebar, dan hidrasi setiap 15-20 menit. Hindari aktivitas berat siang hari.',
  warm: 'Gunakan pakaian ringan dan breathable. Bawa air minum yang cukup.',
  slight_warm: 'Gunakan pakaian ringan dan breathable. Bawa air minum yang cukup.',
  neutral: 'Kondisi nyaman untuk aktivitas outdoor. Tetap gunakan sunscreen.',
  slight_cool: 'Bawa jaket ringan. Kondisi ideal untuk trekking.',
  cool: 'Bawa jaket ringan. Kondisi ideal untuk trekking.',
  cold: 'Gunakan jaket tebal dan layering. Lindungi ekstremitas dari udara dingin.',
  very_cold: 'Gunakan jaket tebal dan layering. Lindungi ekstremitas dari udara dingin.',
};

// Dummy villages - These IDs will be matched with GeoJSON properties
// We use indices (0-9) as IDs which will match the feature index in GeoJSON
export const VILLAGES: Village[] = [
  { id: '0', village_name: 'Kuta', center: [115.1667, -8.7167] },
  { id: '1', village_name: 'Ubud', center: [115.2625, -8.5069] },
  { id: '2', village_name: 'Seminyak', center: [115.1583, -8.6917] },
  { id: '3', village_name: 'Sanur', center: [115.2639, -8.6917] },
  { id: '4', village_name: 'Nusa Dua', center: [115.2333, -8.7917] },
  { id: '5', village_name: 'Jimbaran', center: [115.1611, -8.7833] },
  { id: '6', village_name: 'Canggu', center: [115.1333, -8.6500] },
  { id: '7', village_name: 'Lovina', center: [115.0250, -8.1500] },
  { id: '8', village_name: 'Amed', center: [115.6417, -8.3417] },
  { id: '9', village_name: 'Tanah Lot', center: [115.0861, -8.6211] },
];

// Village name mapping for GeoJSON matching
export const VILLAGE_NAME_MAP: Record<string, string> = {
  'Kuta': '0',
  'Ubud': '1', 
  'Seminyak': '2',
  'Sanur': '3',
  'Nusa Dua': '4',
  'Jimbaran': '5',
  'Canggu': '6',
  'Lovina': '7',
  'Amed': '8',
  'Tanah Lot': '9',
};

// Generate forecast times (3 hours interval, 3 days)
function generateForecastTimes(): string[] {
  const times: string[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(Math.floor(now.getHours() / 3) * 3);

  for (let i = 0; i < 24; i++) { // 24 slots = 3 days x 8 slots
    const time = new Date(now.getTime() + i * 3 * 60 * 60 * 1000);
    times.push(time.toISOString());
  }
  return times;
}

// Random thermal category generator with seed for consistency
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getRandomCategory(seed: number): ThermalCategory {
  const categories: ThermalCategory[] = [
    'neutral', 'neutral', 'neutral', // weighted towards neutral
    'slight_warm', 'slight_warm',
    'warm', 'warm',
    'hot',
    'slight_cool',
    'cool',
  ];
  const index = Math.floor(seededRandom(seed) * categories.length);
  return categories[index];
}

// Generate PET value based on category (tropical standard)
function getPETValueForCategory(category: ThermalCategory, seed: number): number {
  const ranges = PET_RANGES.tropical[category];
  const min = Math.max(ranges.min, 14);
  const max = Math.min(ranges.max, 45);
  return Math.round((min + seededRandom(seed + 1) * (max - min)) * 10) / 10;
}

// Weather conditions
const WEATHER_CONDITIONS = ['Cerah', 'Cerah Berawan', 'Berawan', 'Berawan Tebal', 'Hujan Ringan', 'Hujan Sedang'];
const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const VISIBILITY_OPTIONS = ['Baik', 'Sedang', 'Buruk'];

// Generate dummy forecast batch
export const FORECAST_BATCH: ForecastBatch = {
  id: 'batch-001',
  produced_at: new Date().toISOString(),
  is_latest: true,
  forecast_start: generateForecastTimes()[0],
  forecast_end: generateForecastTimes()[23],
};

// Generate all forecast times
export const FORECAST_TIMES = generateForecastTimes();

// Generate dummy weather forecasts with deterministic seeding
export function generateWeatherForecasts(): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  let idCounter = 1;

  VILLAGES.forEach((village, villageIdx) => {
    FORECAST_TIMES.forEach((time, timeIdx) => {
      const seed = villageIdx * 100 + timeIdx;
      const category = getRandomCategory(seed);
      const petValue = getPETValueForCategory(category, seed);
      
      forecasts.push({
        id: `wf-${idCounter++}`,
        village_id: village.id,
        batch_id: FORECAST_BATCH.id,
        forecast_time: time,
        temperature: Math.round((24 + seededRandom(seed + 2) * 10) * 10) / 10,
        humidity: Math.round(60 + seededRandom(seed + 3) * 30),
        wind_speed: Math.round((5 + seededRandom(seed + 4) * 20) * 10) / 10,
        wind_direction: WIND_DIRECTIONS[Math.floor(seededRandom(seed + 5) * WIND_DIRECTIONS.length)],
        weather_condition: WEATHER_CONDITIONS[Math.floor(seededRandom(seed + 6) * WEATHER_CONDITIONS.length)],
        visibility: VISIBILITY_OPTIONS[Math.floor(seededRandom(seed + 7) * 3)],
        pet_value: petValue,
        thermal_category: category,
        thermal_sensation_scale: SENSATION_SCALE[category],
      });
    });
  });

  return forecasts;
}

// Pre-generate forecasts
export const WEATHER_FORECASTS = generateWeatherForecasts();

// Helper function to get forecast for specific village and time
export function getForecast(villageId: string, forecastTime: string): WeatherForecast | undefined {
  return WEATHER_FORECASTS.find(
    (f) => f.village_id === villageId && f.forecast_time === forecastTime
  );
}

// Helper function to get all forecasts for a specific time
export function getForecastsByTime(forecastTime: string): Map<string, WeatherForecast> {
  const map = new Map<string, WeatherForecast>();
  WEATHER_FORECASTS.filter((f) => f.forecast_time === forecastTime).forEach((f) => {
    map.set(f.village_id, f);
  });
  return map;
}

// Get village by name
export function getVillageIdByName(name: string): string | undefined {
  // Try exact match first
  if (VILLAGE_NAME_MAP[name]) {
    return VILLAGE_NAME_MAP[name];
  }
  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [villageName, id] of Object.entries(VILLAGE_NAME_MAP)) {
    if (villageName.toLowerCase() === lowerName) {
      return id;
    }
  }
  return undefined;
}

// Get village by ID
export function getVillageById(id: string): Village | undefined {
  return VILLAGES.find(v => v.id === id);
}
