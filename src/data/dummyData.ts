// Dummy data sesuai struktur database PRD

export interface Village {
  id: string;
  village_name: string;
  destination_name: string;
  kdebps: string;
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
  local_datetime: string;
  t: number; // temperature
  hu: number; // humidity
  ws: number; // wind speed km/h
  wd: string; // wind direction
  wd_deg: number; // wind direction degrees
  wd_to: string; // wind direction to
  tcc: number; // total cloud cover
  weather: number; // weather code
  weather_desc: string; // weather description
  weather_desc_en: string;
  tp: number; // precipitation
  vs: number; // visibility meters
  vs_text: string; // visibility text
  time_index: string;
  pet_value: number;
  thermal_category_temperate: ThermalCategory;
  thermal_category_tropical: ThermalCategory;
  class_temperate: string;
  class_tropical: string;
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

// Destinasi wisata dengan KDEPUM sesuai GeoJSON (bukan KDEBPS karena KDEBPS null di data)
export const VILLAGES: Village[] = [
  { id: '5103011002', village_name: 'Kuta', destination_name: 'Pantai Kuta', kdebps: '5103011002', center: [115.1667, -8.7167] },
  { id: '5103051004', village_name: 'Benoa', destination_name: 'Pantai Nusa Dua', kdebps: '5103051004', center: [115.2333, -8.7917] },
  { id: '5102062004', village_name: 'Beraban', destination_name: 'Pura Tanah Lot', kdebps: '5102062004', center: [115.0861, -8.6211] },
  { id: '5104062002', village_name: 'Tegallalang', destination_name: 'Tegallalang Rice Terrace', kdebps: '5104062002', center: [115.2625, -8.4333] },
  { id: '5104051005', village_name: 'Ubud', destination_name: 'Monkey Forest Ubud', kdebps: '5104051005', center: [115.2625, -8.5069] },
  { id: '5106042029', village_name: 'Kintamani', destination_name: 'Danau Batur (Kintamani)', kdebps: '5106042029', center: [115.3833, -8.2417] },
  { id: '5102092008', village_name: 'Candikuning', destination_name: 'Danau Beratan (Bedugul)', kdebps: '5102092008', center: [115.1667, -8.2750] },
  { id: '5104012008', village_name: 'Kemenuh', destination_name: 'Air Terjun Tegenungan', kdebps: '5104012008', center: [115.2889, -8.5750] },
];

// Village name mapping for GeoJSON matching by KDEPUM (formatted without dots to match normalized ID)
export const VILLAGE_KDEPUM_MAP: Record<string, string> = {
  '5103011002': 'Pantai Kuta',
  '5103051004': 'Pantai Nusa Dua',
  '5102062004': 'Pura Tanah Lot',
  '5104062002': 'Tegallalang Rice Terrace',
  '5104051005': 'Monkey Forest Ubud',
  '5106042029': 'Danau Batur (Kintamani)',
  '5102092008': 'Danau Beratan (Bedugul)',
  '5104012008': 'Air Terjun Tegenungan',
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

// Random with seed for consistency
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get thermal category based on PET value and standard
function getCategoryFromPET(petValue: number, standard: PETStandard): ThermalCategory {
  const ranges = PET_RANGES[standard];
  for (const [category, range] of Object.entries(ranges)) {
    if (petValue >= range.min && petValue < range.max) {
      return category as ThermalCategory;
    }
  }
  return 'neutral';
}

// Weather descriptions mapping
const WEATHER_MAP: Record<number, { desc: string; desc_en: string }> = {
  0: { desc: 'Cerah', desc_en: 'Clear' },
  1: { desc: 'Cerah Berawan', desc_en: 'Partly Cloudy' },
  2: { desc: 'Cerah Berawan', desc_en: 'Partly Cloudy' },
  3: { desc: 'Berawan', desc_en: 'Mostly Cloudy' },
  4: { desc: 'Berawan Tebal', desc_en: 'Overcast' },
  5: { desc: 'Hujan Ringan', desc_en: 'Light Rain' },
  60: { desc: 'Hujan Ringan', desc_en: 'Light Rain' },
  61: { desc: 'Hujan Sedang', desc_en: 'Moderate Rain' },
  63: { desc: 'Hujan Lebat', desc_en: 'Heavy Rain' },
  95: { desc: 'Hujan Petir', desc_en: 'Thunderstorm' },
};

const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const WIND_TO_DIRECTIONS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

// Dummy forecast data based on user's example - different for each location and time
const BASE_FORECASTS: Record<string, { baseT: number; baseHu: number; basePET: number; elevation: 'coastal' | 'highland' | 'midland' }> = {
  '5103011002': { baseT: 26, baseHu: 87, basePET: 25.5, elevation: 'coastal' }, // Pantai Kuta
  '5103051004': { baseT: 27, baseHu: 85, basePET: 26.8, elevation: 'coastal' }, // Pantai Nusa Dua
  '5102062004': { baseT: 26, baseHu: 82, basePET: 27.2, elevation: 'coastal' }, // Tanah Lot
  '5104062002': { baseT: 24, baseHu: 80, basePET: 24.5, elevation: 'midland' }, // Tegallalang
  '5104051005': { baseT: 25, baseHu: 78, basePET: 25.2, elevation: 'midland' }, // Ubud
  '5106042029': { baseT: 20, baseHu: 75, basePET: 19.0, elevation: 'highland' }, // Kintamani
  '5102092008': { baseT: 21, baseHu: 82, basePET: 20.5, elevation: 'highland' }, // Bedugul
  '5104012008': { baseT: 25, baseHu: 83, basePET: 26.0, elevation: 'midland' }, // Tegenungan
};

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

// Generate dummy weather forecasts with realistic variation
export function generateWeatherForecasts(): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  let idCounter = 1;

  VILLAGES.forEach((village, villageIdx) => {
    const base = BASE_FORECASTS[village.id] || { baseT: 26, baseHu: 80, basePET: 25.0, elevation: 'midland' };
    
    FORECAST_TIMES.forEach((time, timeIdx) => {
      const seed = villageIdx * 100 + timeIdx;
      const date = new Date(time);
      const hour = date.getHours();
      
      // Time-based temperature variation
      let tempVariation = 0;
      if (hour >= 6 && hour < 12) {
        tempVariation = (hour - 6) * 0.5; // Morning warming
      } else if (hour >= 12 && hour < 15) {
        tempVariation = 3 + seededRandom(seed) * 2; // Peak afternoon
      } else if (hour >= 15 && hour < 18) {
        tempVariation = 2 - (hour - 15) * 0.5; // Afternoon cooling
      } else {
        tempVariation = -2 + seededRandom(seed); // Evening/night cooler
      }
      
      const t = Math.round((base.baseT + tempVariation + seededRandom(seed) * 2 - 1) * 10) / 10;
      const hu = Math.round(base.baseHu + seededRandom(seed + 1) * 10 - 5);
      const ws = Math.round((10 + seededRandom(seed + 2) * 15) * 10) / 10;
      const wdIndex = Math.floor(seededRandom(seed + 3) * WIND_DIRECTIONS.length);
      const wd = WIND_DIRECTIONS[wdIndex];
      const wd_to = WIND_TO_DIRECTIONS[wdIndex];
      const wd_deg = Math.round(seededRandom(seed + 4) * 360);
      const tcc = Math.round(60 + seededRandom(seed + 5) * 40);
      const weatherCode = hour >= 12 && hour < 18 && seededRandom(seed + 6) > 0.6 
        ? (seededRandom(seed + 7) > 0.7 ? 61 : 60) 
        : Math.floor(seededRandom(seed + 8) * 4);
      const weather = WEATHER_MAP[weatherCode] || WEATHER_MAP[3];
      const tp = weatherCode >= 60 ? Math.round(seededRandom(seed + 9) * 5 * 10) / 10 : 0;
      const vs = Math.round(8000 + seededRandom(seed + 10) * 4000);
      
      // PET calculation with time variation
      let petVariation = tempVariation * 0.8;
      if (base.elevation === 'highland') {
        petVariation -= 2;
      } else if (base.elevation === 'coastal') {
        petVariation += 1;
      }
      
      const pet = Math.round((base.basePET + petVariation + seededRandom(seed + 11) * 3 - 1.5) * 100) / 100;
      
      const categoryTemperate = getCategoryFromPET(pet, 'temperate');
      const categoryTropical = getCategoryFromPET(pet, 'tropical');
      
      const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000); // WITA = UTC+8
      
      forecasts.push({
        id: `wf-${idCounter++}`,
        village_id: village.id,
        batch_id: FORECAST_BATCH.id,
        forecast_time: time,
        local_datetime: localDate.toISOString().replace('T', ' ').slice(0, 19),
        t,
        hu,
        ws,
        wd,
        wd_deg,
        wd_to,
        tcc,
        weather: weatherCode,
        weather_desc: weather.desc,
        weather_desc_en: weather.desc_en,
        tp,
        vs,
        vs_text: vs < 10000 ? '< 10 km' : '> 10 km',
        time_index: `${hour}-${(hour + 3) % 24}`,
        pet_value: pet,
        thermal_category_temperate: categoryTemperate,
        thermal_category_tropical: categoryTropical,
        class_temperate: PET_RANGES.temperate[categoryTemperate].labelId + ` (${PET_RANGES.temperate[categoryTemperate].min}-${PET_RANGES.temperate[categoryTemperate].max === 999 ? '∞' : PET_RANGES.temperate[categoryTemperate].max})`,
        class_tropical: PET_RANGES.tropical[categoryTropical].labelId + ` (${PET_RANGES.tropical[categoryTropical].min}-${PET_RANGES.tropical[categoryTropical].max === 999 ? '∞' : PET_RANGES.tropical[categoryTropical].max})`,
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

// Get village by KDEBPS
export function getVillageByKdebps(kdebps: string): Village | undefined {
  return VILLAGES.find(v => v.kdebps === kdebps);
}

// Get village by ID
export function getVillageById(id: string): Village | undefined {
  return VILLAGES.find(v => v.id === id);
}

// Get thermal category based on current standard
export function getThermalCategory(forecast: WeatherForecast, standard: PETStandard): ThermalCategory {
  return standard === 'temperate' ? forecast.thermal_category_temperate : forecast.thermal_category_tropical;
}
