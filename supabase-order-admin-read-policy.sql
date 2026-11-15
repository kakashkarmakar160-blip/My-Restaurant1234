-- MY HOTEL: Enable the password-only Admin page to read orders and update order status.
-- SECURITY WARNING: With no Supabase Auth or server-side function, anon access is public.
-- Anyone with the website's public key can read order history and change order status.
-- Do not store customer secrets in these tables.

GRANT SELECT ON TABLE
  public.restaurant_orders,
  public.restaurant_order_items
TO anon, authenticated;

GRANT UPDATE (status) ON TABLE public.restaurant_orders
TO anon, authenticated;

DROP POLICY IF EXISTS "public can read restaurant orders" ON public.restaurant_orders;
CREATE POLICY "public can read restaurant orders"
ON public.restaurant_orders
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public can read restaurant order items" ON public.restaurant_order_items;
CREATE POLICY "public can read restaurant order items"
ON public.restaurant_order_items
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public can update restaurant order status" ON public.restaurant_orders;
CREATE POLICY "public can update restaurant order status"
ON public.restaurant_orders
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'));
