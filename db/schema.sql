  -- WebGIS Thermal Comfort Forecast - Normalized Database Schema
  -- PostgreSQL + Supabase-ready (without PostGIS geometry)

  -- Extensions
  CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

  -- =====================================================
  -- Reset: Drop old functions/views/tables
  -- =====================================================
  DROP FUNCTION IF EXISTS public.villages_geojson() CASCADE;
  DROP VIEW IF EXISTS public.latest_weather_forecasts CASCADE;
  DROP VIEW IF EXISTS public.latest_batch CASCADE;
  DROP TABLE IF EXISTS public.weather_forecasts CASCADE;
  DROP TABLE IF EXISTS public.forecast_batches CASCADE;
  DROP TABLE IF EXISTS public.destinations CASCADE;
  DROP TABLE IF EXISTS public.villages CASCADE;
  DROP TABLE IF EXISTS public.thermal_categories CASCADE;

  -- =====================================================
  -- Table: thermal_categories (Lookup Kategori Termal)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.thermal_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert kategori standar
  INSERT INTO public.thermal_categories (category_key, category_name)
  VALUES
    ('very_hot', 'Sangat Panas'),
    ('hot', 'Panas'),
    ('warm', 'Hangat'),
    ('slight_warm', 'Agak Hangat'),
    ('neutral', 'Netral'),
    ('slight_cool', 'Agak Sejuk'),
    ('cool', 'Sejuk'),
    ('cold', 'Dingin'),
    ('very_cold', 'Sangat Dingin')
  ON CONFLICT (category_key) DO NOTHING;

  -- =====================================================
  -- Table: regencies (Kabupaten)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.regencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE
  );

  -- =====================================================
  -- Table: districts (Kecamatan)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regency_id UUID NOT NULL REFERENCES public.regencies(id) ON DELETE RESTRICT,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT uniq_district_per_regency UNIQUE (regency_id, name)
  );

  -- =====================================================
  -- Table: villages (Master Data Desa/Kelurahan dengan KDEPUM)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_name VARCHAR(100) NOT NULL UNIQUE,
    -- Kode KDEPUM (dengan titik) untuk sinkronisasi ke file GeoJSON statis
    kdepum_code VARCHAR(20) NOT NULL UNIQUE,
    regency_id UUID REFERENCES public.regencies(id) ON DELETE RESTRICT,
    district_id UUID REFERENCES public.districts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Auto-update updated_at on row changes
  CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS villages_set_updated_at ON public.villages;
  CREATE TRIGGER villages_set_updated_at
  BEFORE UPDATE ON public.villages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  -- =====================================================
  -- Table: destinations (Master Data Destinasi Wisata)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
    destination_name VARCHAR(120) NOT NULL,
    -- Optional: URL gambar destinasi (dipakai WebGIS untuk hero image popup)
    image_url TEXT,
    -- Koordinat/elevasi per destinasi (untuk biometeo/PET; bisa berbeda dalam desa yang sama)
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    sea_level_height DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Satu destinasi bisa unik per village (optional constraint)
    CONSTRAINT uniq_destination_per_village UNIQUE (village_id, destination_name)
  );

  -- Auto-update updated_at on row changes
  DROP TRIGGER IF EXISTS destinations_set_updated_at ON public.destinations;
  CREATE TRIGGER destinations_set_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  -- Index untuk query cepat
  CREATE INDEX IF NOT EXISTS idx_destinations_village_id
  ON public.destinations (village_id);

  -- =====================================================
  -- Table: forecast_batches (Batch Produksi Data)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.forecast_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produced_at TIMESTAMPTZ NOT NULL UNIQUE,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    forecast_start TIMESTAMPTZ NOT NULL,
    forecast_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Only one "latest" batch at any time
  CREATE UNIQUE INDEX IF NOT EXISTS only_one_latest
  ON public.forecast_batches (is_latest)
  WHERE is_latest;

  -- Helpful ordering index
  CREATE INDEX IF NOT EXISTS idx_batches_produced_at
  ON public.forecast_batches (produced_at DESC);

  -- Trigger to automatically set other batches to is_latest = FALSE
  CREATE OR REPLACE FUNCTION public.forecast_batches_set_latest()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.is_latest THEN
      UPDATE public.forecast_batches
      SET is_latest = FALSE
      WHERE is_latest = TRUE AND id <> NEW.id;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS forecast_batches_set_latest_on_insert ON public.forecast_batches;
  CREATE TRIGGER forecast_batches_set_latest_on_insert
  BEFORE INSERT ON public.forecast_batches
  FOR EACH ROW EXECUTE FUNCTION public.forecast_batches_set_latest();

  DROP TRIGGER IF EXISTS forecast_batches_set_latest_on_update ON public.forecast_batches;
  CREATE TRIGGER forecast_batches_set_latest_on_update
  BEFORE UPDATE OF is_latest ON public.forecast_batches
  FOR EACH ROW EXECUTE FUNCTION public.forecast_batches_set_latest();


  -- =====================================================
  -- Table: weather_forecasts (Data Prediksi Cuaca & PET)
  -- =====================================================
  CREATE TABLE IF NOT EXISTS public.weather_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Forecast per destinasi (karena lat/lon/elev per destinasi mempengaruhi biometeo/PET)
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.forecast_batches(id) ON DELETE CASCADE,
    forecast_time TIMESTAMPTZ NOT NULL,

    temperature NUMERIC(4,1) NOT NULL, -- °C
    humidity NUMERIC(4,1) NOT NULL,    -- %
    wind_speed NUMERIC(5,2) NOT NULL,  -- km/h
    wind_direction VARCHAR(10) NOT NULL,
    weather_condition VARCHAR(100) NOT NULL,
    visibility VARCHAR(50) NOT NULL,

    pet_value NUMERIC(5,2) NOT NULL,

    -- Kolom biometeo tambahan (opsional, tapi dipakai pipeline produksi)
    cloud_cover NUMERIC(5,2),
    tmrt NUMERIC(7,2),
    vapor_pressure NUMERIC(7,3),
    wind_speed_1_1m NUMERIC(7,3),
    
    -- Dual thermal category references (FK to thermal_categories)
    temperate_thermal_category UUID REFERENCES public.thermal_categories(id) ON DELETE SET NULL,
    sub_tropic_thermal_category UUID REFERENCES public.thermal_categories(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT humidity_range CHECK (humidity >= 0 AND humidity <= 100),
    CONSTRAINT uniq_destination_batch_time UNIQUE (destination_id, batch_id, forecast_time)
  );

  -- Indexes to speed queries
  CREATE INDEX IF NOT EXISTS idx_forecasts_batch_time
  ON public.weather_forecasts (batch_id, forecast_time);

  CREATE INDEX IF NOT EXISTS idx_forecasts_destination_batch
  ON public.weather_forecasts (destination_id, batch_id);


  -- =====================================================
  -- Views for convenience
  -- =====================================================
  CREATE OR REPLACE VIEW public.latest_batch 
  WITH (security_invoker = true) AS
  SELECT id, produced_at, forecast_start, forecast_end
  FROM public.forecast_batches
  WHERE is_latest = TRUE;

  -- View untuk mendapatkan villages dengan destinations (untuk query yang lebih mudah)
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

  -- End of schema
