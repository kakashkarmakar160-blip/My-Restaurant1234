-- MY HOTEL: Allow browser uploads to the public image bucket without Supabase Auth.
-- WARNING: Because there is no Authentication/Edge Function, anyone who knows
-- this public bucket name can upload images (maximum 5 MB; image MIME types only).
-- Run this in Supabase SQL Editor only if you accept that trade-off.

drop policy if exists "hotel images public upload" on storage.objects;
create policy "hotel images public upload"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'hotel-images');
