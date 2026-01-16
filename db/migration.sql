-- Migration script: Normalize villages and destinations tables
-- Run this after applying the new schema.sql

-- Step 1: Create destinations table if not exists (should already exist from schema.sql)
-- This is just for reference

-- Step 2: Migrate existing data from old villages table to new structure
-- Assuming old villages table has: id, village_name, destination_name, kdepum_code

-- Insert unique villages (desa/kdepum) first
INSERT INTO public.villages (id, village_name, kdepum_code, created_at, updated_at)
SELECT DISTINCT ON (kdepum_code)
  id,  -- Keep original ID for forecast data compatibility
  village_name,
  kdepum_code,
  created_at,
  updated_at
FROM public.villages_old  -- Replace with actual old table name
WHERE kdepum_code IS NOT NULL
ON CONFLICT (kdepum_code) DO NOTHING;

-- Insert destinations referencing villages
INSERT INTO public.destinations (village_id, destination_name, created_at, updated_at)
SELECT 
  v.id AS village_id,
  v_old.destination_name,
  v_old.created_at,
  v_old.updated_at
FROM public.villages_old v_old
INNER JOIN public.villages v ON v.kdepum_code = v_old.kdepum_code
WHERE v_old.destination_name IS NOT NULL
ON CONFLICT (village_id, destination_name) DO NOTHING;

-- Note: If you're migrating from existing data, you may need to:
-- 1. Rename old villages table: ALTER TABLE villages RENAME TO villages_old;
-- 2. Run schema.sql to create new tables
-- 3. Run this migration script
-- 4. Verify data integrity
-- 5. Drop old table: DROP TABLE villages_old;
