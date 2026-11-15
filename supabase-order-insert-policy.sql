-- MY HOTEL: allow customers to submit orders without Supabase Auth.
-- This matches the password-only, no-Auth setup requested for this website.
-- WARNING: anyone with the public website key can submit orders. This does not
-- make the browser-only Admin password a secure database permission boundary.

-- Ensure the browser public role can insert rows into both order tables.
grant insert on table public.restaurant_orders to anon, authenticated;
grant insert on table public.restaurant_order_items to anon, authenticated;

-- Recreate policies safely if this script is run more than once.
drop policy if exists "public can create restaurant orders" on public.restaurant_orders;
create policy "public can create restaurant orders"
on public.restaurant_orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "public can create restaurant order items" on public.restaurant_order_items;
create policy "public can create restaurant order items"
on public.restaurant_order_items
for insert
to anon, authenticated
with check (true);
