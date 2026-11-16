-- My Hotel: add GPS delivery-radius settings
-- Run this once in Supabase Dashboard -> SQL Editor.
ALTER TABLE public.hotel_settings
  ADD COLUMN IF NOT EXISTS location_latitude double precision,
  ADD COLUMN IF NOT EXISTS location_longitude double precision,
  ADD COLUMN IF NOT EXISTS delivery_radius_meters integer NOT NULL DEFAULT 500;

-- Keep the default radius at 500 metres for existing settings rows.
UPDATE public.hotel_settings
SET delivery_radius_meters = 500
WHERE delivery_radius_meters IS NULL OR delivery_radius_meters < 1;
