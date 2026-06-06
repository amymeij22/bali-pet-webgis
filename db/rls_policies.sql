-- =========================================================================
-- SQL Migration: Setup Row Level Security (RLS) & Policies
-- Proyek: Bali PET WebGIS & Pipeline biometeo_worker
-- =========================================================================
-- Skrip ini digunakan untuk mengaktifkan RLS pada seluruh tabel di database
-- produksi Supabase. Kebijakan (policies) dikonfigurasi agar:
-- 1. WebGIS (peran anon/authenticated) dapat mem-fetch seluruh data master 
--    dan prakiraan cuaca secara bebas (Read-Only).
-- 2. WebGIS dapat melakukan registrasi & update token Push Notification.
-- 3. Pipeline backend (action) yang terkoneksi langsung via PostgreSQL user
--    'postgres' (superuser/owner) dibebaskan dari pembatasan RLS secara bawaan.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Langkah 1: Mengaktifkan RLS pada Seluruh Tabel Publik
-- -------------------------------------------------------------------------
ALTER TABLE public.thermal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- Langkah 2: Membuat Kebijakan SELECT (Read-Only) untuk Pengguna Publik
-- -------------------------------------------------------------------------

-- Mengizinkan pembacaan kategori kenyamanan termal
DROP POLICY IF EXISTS "Allow public read access to thermal_categories" ON public.thermal_categories;
CREATE POLICY "Allow public read access to thermal_categories" 
  ON public.thermal_categories FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan pembacaan wilayah kabupaten (regencies)
DROP POLICY IF EXISTS "Allow public read access to regencies" ON public.regencies;
CREATE POLICY "Allow public read access to regencies" 
  ON public.regencies FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan pembacaan wilayah kecamatan (districts)
DROP POLICY IF EXISTS "Allow public read access to districts" ON public.districts;
CREATE POLICY "Allow public read access to districts" 
  ON public.districts FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan pembacaan wilayah desa (villages)
DROP POLICY IF EXISTS "Allow public read access to villages" ON public.villages;
CREATE POLICY "Allow public read access to villages" 
  ON public.villages FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan pembacaan master data destinasi wisata
DROP POLICY IF EXISTS "Allow public read access to destinations" ON public.destinations;
CREATE POLICY "Allow public read access to destinations" 
  ON public.destinations FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan pembacaan metadata batch prakiraan cuaca
DROP POLICY IF EXISTS "Allow public read access to forecast_batches" ON public.forecast_batches;
CREATE POLICY "Allow public read access to forecast_batches" 
  ON public.forecast_batches FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan pembacaan data prediksi parameter cuaca dan nilai PET
DROP POLICY IF EXISTS "Allow public read access to weather_forecasts" ON public.weather_forecasts;
CREATE POLICY "Allow public read access to weather_forecasts" 
  ON public.weather_forecasts FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- -------------------------------------------------------------------------
-- Langkah 3: Membuat Kebijakan Baca-Tulis untuk Push Notifications Subscriptions
-- -------------------------------------------------------------------------

-- Mengizinkan pembacaan langganan push (opsional untuk sinkronisasi lokal browser)
DROP POLICY IF EXISTS "Allow public read access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public read access to push_subscriptions" 
  ON public.push_subscriptions FOR SELECT TO anon, authenticated, service_role 
  USING (true);

-- Mengizinkan browser pengunjung mendaftarkan token push baru (INSERT / UPSERT)
DROP POLICY IF EXISTS "Allow public insert access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public insert access to push_subscriptions" 
  ON public.push_subscriptions FOR INSERT TO anon, authenticated, service_role 
  WITH CHECK (true);

-- Mengizinkan browser pengunjung menonaktifkan/memperbarui token push mereka (UPDATE)
DROP POLICY IF EXISTS "Allow public update access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public update access to push_subscriptions" 
  ON public.push_subscriptions FOR UPDATE TO anon, authenticated, service_role 
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------------------------
-- Langkah 4: Mengamankan View dengan SECURITY INVOKER (Best Practice Supabase)
-- -------------------------------------------------------------------------
-- Secara default, view di PostgreSQL lama dapat dievaluasi menggunakan hak akses
-- pembuatnya (security definer). Untuk mematuhi aturan RLS tabel dasar, kita ubah
-- view menjadi SECURITY INVOKER menggunakan opsi 'security_invoker = true'.
-- -------------------------------------------------------------------------

-- 1. Rekonfigurasi View public.latest_batch
CREATE OR REPLACE VIEW public.latest_batch 
WITH (security_invoker = true) AS
SELECT id, produced_at, forecast_start, forecast_end
FROM public.forecast_batches
WHERE is_latest = TRUE;

-- 2. Rekonfigurasi View public.villages_with_destinations
CREATE OR REPLACE VIEW public.villages_with_destinations 
WITH (security_invoker = true) AS
SELECT 
  v.id AS village_id,
  v.village_name,
  v.kdepum_code,
  r.name AS regency,
  di.name AS district,
  COALESCE(
    json_agg(
      json_build_object(
        'id', d.id,
        'destination_name', d.destination_name,
        'image_url', d.image_url,
        'latitude', d.latitude,
        'longitude', d.longitude,
        'sea_level_height', d.sea_level_height
      ) ORDER BY d.destination_name
    ) FILTER (WHERE d.id IS NOT NULL),
    '[]'::json
  ) AS destinations
FROM public.villages v
LEFT JOIN public.regencies r ON r.id = v.regency_id
LEFT JOIN public.districts di ON di.id = v.district_id
LEFT JOIN public.destinations d ON v.id = d.village_id
GROUP BY v.id, v.village_name, v.kdepum_code, r.name, di.name;

-- =========================================================================
-- Selesai: Terapkan perubahan ini di dashboard Supabase -> SQL Editor
-- =========================================================================
