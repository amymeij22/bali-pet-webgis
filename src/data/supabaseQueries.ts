import { supabase } from '@/lib/supabaseClient';

// Types aligned with schema v2
export interface ThermalCategoryRow {
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
  kdepum_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface Destination {
  id: string;
  village_id: string;
  destination_name: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sea_level_height?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Combined interface for villages with their destinations
export interface VillageWithDestinations extends Village {
  regency?: string | null;
  district?: string | null;
  destinations: Destination[];
}

export interface WeatherForecast {
  id: string;
  destination_id: string;
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
  cloud_cover?: number | null;
  tmrt?: number | null;
  vapor_pressure?: number | null;
  wind_speed_1_1m?: number | null;
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

// Get villages list (desa/kdepum only)
export async function getVillages(): Promise<Village[]> {
  const { data, error } = await supabase
    .from('villages')
    .select('id, village_name, kdepum_code, created_at, updated_at')
    .order('village_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Get all destinations
export async function getDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('id, village_id, destination_name, created_at, updated_at')
    .order('destination_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Get villages with their destinations (for map and popup)
export async function getVillagesWithDestinations(): Promise<VillageWithDestinations[]> {
  // NOTE: View `villages_with_destinations` saat ini error 400 di environment user,
  // jadi jangan dipakai dulu agar WebGIS tetap berfungsi.
  const { data, error } = await supabase
    .from('villages')
    .select(
      `
      id,
      village_name,
      kdepum_code,
      created_at,
      updated_at,
      destinations (
        id,
        village_id,
        destination_name,
        latitude,
        longitude,
        sea_level_height,
        created_at,
        updated_at
      )
    `
    )
    .order('village_name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((v: any) => ({
    id: v.id,
    village_name: v.village_name,
    kdepum_code: v.kdepum_code,
    regency: null,
    district: null,
    destinations: (v.destinations || []).map((d: any) => ({
      id: d.id,
      village_id: d.village_id,
      destination_name: d.destination_name,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      sea_level_height: d.sea_level_height ?? null,
      created_at: d.created_at,
      updated_at: d.updated_at,
    })),
  }));
}

// Get all destinations with village info (for sidebar - flat list)
export async function getDestinationsWithVillage(): Promise<
  Array<
    Destination & {
      village_name: string;
      kdepum_code: string;
      district?: string | null;
      regency?: string | null;
    }
  >
> {
  const { data, error } = await supabase
    .from('destinations')
    .select(`
      id,
      village_id,
      destination_name,
      image_url,
      latitude,
      longitude,
      sea_level_height,
      created_at,
      updated_at,
      villages (
        village_name,
        kdepum_code,
        regencies ( name ),
        districts ( name )
      )
    `)
    .order('destination_name', { ascending: true });
  
  if (error) throw error;
  
  // Transform the data
  return (data ?? []).map((d: any) => ({
    id: d.id,
    village_id: d.village_id,
    destination_name: d.destination_name,
    image_url: d.image_url ?? null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    sea_level_height: d.sea_level_height ?? null,
    created_at: d.created_at,
    updated_at: d.updated_at,
    village_name: d.villages?.village_name || '',
    kdepum_code: d.villages?.kdepum_code || '',
    regency: d.villages?.regencies?.name ?? null,
    district: d.villages?.districts?.name ?? null,
  }));
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
export async function getThermalCategories(): Promise<ThermalCategoryRow[]> {
  const { data, error } = await supabase
    .from('thermal_categories')
    .select('id, category_key, category_name')
    .order('category_key', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Deprecated: getChoroplethByTime, getPopupDetail
// Instead: Use getAllForecastsForBatch() on app mount, cache by time/village, read from cache

// Push Notification Subscriptions
export interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: boolean;
  last_notified_batch_id: string | null;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Save push subscription
export async function savePushSubscription(
  endpoint: string,
  p256dh: string,
  auth: string
): Promise<PushSubscription | null> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        is_active: true,
      },
      {
        onConflict: 'endpoint',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[Push] Failed to save subscription:', error);
    return null;
  }

  return data as PushSubscription;
}

// Remove push subscription
export async function removePushSubscription(endpoint: string): Promise<boolean> {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Push] Failed to remove subscription:', error);
    return false;
  }

  return true;
}

// Get all active subscriptions
export async function getActivePushSubscriptions(): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[Push] Failed to get subscriptions:', error);
    return [];
  }

  return (data ?? []) as PushSubscription[];
}