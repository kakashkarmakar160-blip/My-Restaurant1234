-- MY HOTEL v6.3: enable database persistence for admin-managed public data.
-- WARNING: This deliberately allows anon browser clients to change settings,
-- categories, food items and tables because this project uses password-only
-- client-side admin access and no Supabase Auth/Edge Function. Anyone can call
-- these public APIs directly. Do not store secrets or private data in these tables.

ALTER TABLE public.hotel_settings
  ADD COLUMN IF NOT EXISTS logo_text text,
  ADD COLUMN IF NOT EXISTS logo_image_url text,
  ADD COLUMN IF NOT EXISTS welcome_image_url text,
  ADD COLUMN IF NOT EXISTS menu_image_url text,
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS font_size integer;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.hotel_settings, public.food_categories,
  public.restaurant_tables, public.food_items
TO anon, authenticated;

ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon manage hotel settings" ON public.hotel_settings;
CREATE POLICY "anon manage hotel settings" ON public.hotel_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon manage food categories" ON public.food_categories;
CREATE POLICY "anon manage food categories" ON public.food_categories
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon manage restaurant tables" ON public.restaurant_tables;
CREATE POLICY "anon manage restaurant tables" ON public.restaurant_tables
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon manage food items" ON public.food_items;
CREATE POLICY "anon manage food items" ON public.food_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Create the single settings row if it does not exist yet.
INSERT INTO public.hotel_settings (id, hotel_name)
VALUES (true, 'My Hotel')
ON CONFLICT (id) DO NOTHING;
