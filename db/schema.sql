-- WebGIS Thermal Comfort Forecast - Database Schema
-- PostgreSQL + PostGIS + Supabase-ready

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- =====================================================
-- Table: villages (Master Data Desa Wisata)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_name VARCHAR(100) NOT NULL UNIQUE,
  -- Optional: Kode KDEPUM (tanpa titik) untuk sinkronisasi GeoJSON
  kdepum_code VARCHAR(20) UNIQUE,
  geom GEOMETRY(Polygon, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for fast geometry queries
CREATE INDEX IF NOT EXISTS idx_villages_geom ON public.villages USING GIST (geom);

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
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.forecast_batches(id) ON DELETE CASCADE,
  forecast_time TIMESTAMPTZ NOT NULL,

  temperature NUMERIC(4,1) NOT NULL, -- °C
  humidity NUMERIC(4,1) NOT NULL,    -- %
  wind_speed NUMERIC(5,2) NOT NULL,  -- km/h
  wind_direction VARCHAR(10) NOT NULL,
  weather_condition VARCHAR(100) NOT NULL,
  visibility VARCHAR(50) NOT NULL,

  pet_value NUMERIC(5,2) NOT NULL,
  thermal_category VARCHAR(20) NOT NULL,
  thermal_sensation_scale SMALLINT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT humidity_range CHECK (humidity >= 0 AND humidity <= 100),
  CONSTRAINT sensation_scale_range CHECK (thermal_sensation_scale >= -4 AND thermal_sensation_scale <= 4),
  CONSTRAINT thermal_category_valid CHECK (
    thermal_category IN (
      'very_hot','hot','warm','slight_warm','neutral','slight_cool','cool','cold','very_cold'
    )
  ),
  CONSTRAINT uniq_village_batch_time UNIQUE (village_id, batch_id, forecast_time)
);

-- Indexes to speed queries
CREATE INDEX IF NOT EXISTS idx_forecasts_batch_time
ON public.weather_forecasts (batch_id, forecast_time);

CREATE INDEX IF NOT EXISTS idx_forecasts_village_batch
ON public.weather_forecasts (village_id, batch_id);


-- =====================================================
-- Views for convenience
-- =====================================================
CREATE OR REPLACE VIEW public.latest_batch AS
SELECT id, produced_at, forecast_start, forecast_end
FROM public.forecast_batches
WHERE is_latest = TRUE;

CREATE OR REPLACE VIEW public.latest_weather_forecasts AS
SELECT wf.*
FROM public.weather_forecasts wf
JOIN public.forecast_batches fb ON wf.batch_id = fb.id
WHERE fb.is_latest = TRUE;


-- =====================================================
-- Row Level Security (Supabase-friendly, read-only public)
-- =====================================================
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies (adjust role as needed)
DROP POLICY IF EXISTS select_villages_public ON public.villages;
CREATE POLICY select_villages_public
ON public.villages
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS select_batches_public ON public.forecast_batches;
CREATE POLICY select_batches_public
ON public.forecast_batches
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS select_forecasts_public ON public.weather_forecasts;
CREATE POLICY select_forecasts_public
ON public.weather_forecasts
FOR SELECT
USING (TRUE);

-- (Optional) Prevent writes for anon/public roles via Supabase settings.
-- In Supabase, configure RLS + role permissions to allow only SELECT for anon.

-- End of schema
