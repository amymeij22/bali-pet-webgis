-- Migration script: Add destinations.image_url
-- Fokus: hanya menambah kolom baru untuk gambar destinasi.
-- Aman dijalankan berulang (idempotent).

ALTER TABLE IF EXISTS public.destinations
ADD COLUMN IF NOT EXISTS image_url TEXT;
