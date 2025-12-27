import { supabase } from '@/lib/supabaseClient';

// Types aligned with schema v2
export interface ThermalCategory {
  id: string;
  category_key: string;
  category_name: string;
  created_at?: string;
}

export interface ForecastBatch {
  id: string;
  produced_at: string;
  is_latest: boolean;
  forecast_start: string;
  forecast_end: string;
  created_at?: string;
}

export interface Village {
  id: string;
  village_name: string;
  destination_name: string | null;
  kdepum_code: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeatherForecast {
  id: string;
  village_id: string;
  batch_id: string;
  forecast_time: string;
  temperature: number; // Celsius
  humidity: number; // 0-100
  wind_speed: number; // km/h
  wind_direction: string;
  weather_condition: string;
  visibility: string;
  pet_value: number;
  temperate_thermal_category: string | null; // UUID reference
  sub_tropic_thermal_category: string | null; // UUID reference
  created_at?: string;
}

// Get latest batch
export async function getLatestBatch(): Promise<ForecastBatch | null> {
  const { data, error } = await supabase
    .from('forecast_batches')
    .select('id, produced_at, is_latest, forecast_start, forecast_end')
    .eq('is_latest', true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// Get distinct ordered forecast times for a batch
export async function getForecastTimes(batchId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('weather_forecasts')
    .select('forecast_time')
    .eq('batch_id', batchId)
    .order('forecast_time', { ascending: true });
  if (error) throw error;
  const times = Array.from(new Set((data ?? []).map((d) => d.forecast_time))) as string[];
  return times;
}

// Get villages list for sidebar
export async function getVillages(): Promise<Village[]> {
  const { data, error } = await supabase
    .from('villages')
    .select('id, village_name, destination_name, kdepum_code')
    .order('destination_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Get all forecasts for a batch once (used to avoid repeated queries per time)
export async function getAllForecastsForBatch(batchId: string): Promise<WeatherForecast[]> {
  const { data, error } = await supabase
    .from('weather_forecasts')
    .select('*')
    .eq('batch_id', batchId)
    .order('forecast_time', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeatherForecast[];
}

// Get thermal categories for UI display
export async function getThermalCategories(): Promise<ThermalCategory[]> {
  const { data, error } = await supabase
    .from('thermal_categories')
    .select('id, category_key, category_name')
    .order('category_key', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Deprecated: getChoroplethByTime, getPopupDetail
// Instead: Use getAllForecastsForBatch() on app mount, cache by time/village, read from cache
