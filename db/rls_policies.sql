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

-- =========================================================================
-- Selesai: Terapkan perubahan ini di dashboard Supabase -> SQL Editor
-- =========================================================================
