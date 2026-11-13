-- My Hotel: starter database schema for Supabase
-- Run in Supabase SQL Editor. Then create an admin user in Authentication.
create extension if not exists pgcrypto;

create table if not exists public.hotel_settings (
  id boolean primary key default true check (id = true),
  hotel_name text not null default 'My Hotel',
  tagline text default 'Fresh food • Happy moments',
  logo_url text,
  phone text,
  address text,
  currency text not null default '₹',
  font_size int not null default 16 check (font_size between 12 and 22),
  card_size text not null default 'normal',
  accent text not null default '#237653',
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

create table if not exists public.food_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_bn text,
  category_id uuid references public.food_categories(id) on delete set null,
  category_name text not null,
  description text,
  image_url text,
  price numeric(10,2) not null check (price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  available boolean not null default true,
  today_available boolean not null default true,
  stock_quantity int,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number int not null unique,
  table_name text not null,
  active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  table_id uuid references public.restaurant_tables(id),
  table_name text not null,
  customer_name text,
  notes text,
  subtotal numeric(10,2) not null,
  discount_total numeric(10,2) not null,
  grand_total numeric(10,2) not null,
  payment_method text not null default 'Cash at Counter',
  status text not null default 'Pending' check (status in ('Pending','Preparing','Ready','Completed','Cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  food_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  discount_percent numeric(5,2) not null default 0,
  line_total numeric(10,2) not null
);

-- Admin authorization: add the owner's Auth UID to this table after creating their Auth account.
create table if not exists public.hotel_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create or replace function public.is_hotel_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.hotel_admins where user_id = auth.uid()); $$;

alter table public.hotel_settings enable row level security;
alter table public.food_categories enable row level security;
alter table public.food_items enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.hotel_admins enable row level security;

-- Public customers can read only published/available menu and active tables.
create policy "public read settings" on public.hotel_settings for select using (true);
create policy "public read categories" on public.food_categories for select using (true);
create policy "public read available food" on public.food_items for select using (available and today_available);
create policy "public read active tables" on public.restaurant_tables for select using (active);

-- Admin full access.
create policy "admin manage settings" on public.hotel_settings for all using (public.is_hotel_admin()) with check (public.is_hotel_admin());
create policy "admin manage categories" on public.food_categories for all using (public.is_hotel_admin()) with check (public.is_hotel_admin());
create policy "admin manage food" on public.food_items for all using (public.is_hotel_admin()) with check (public.is_hotel_admin());
create policy "admin manage tables" on public.restaurant_tables for all using (public.is_hotel_admin()) with check (public.is_hotel_admin());
create policy "admin read orders" on public.orders for select using (public.is_hotel_admin());
create policy "admin update orders" on public.orders for update using (public.is_hotel_admin()) with check (public.is_hotel_admin());
create policy "admin read order items" on public.order_items for select using (public.is_hotel_admin());
create policy "admin manage order items" on public.order_items for all using (public.is_hotel_admin()) with check (public.is_hotel_admin());
create policy "admin read own admin row" on public.hotel_admins for select using (user_id = auth.uid());

-- Public order creation is handled through a SECURITY DEFINER RPC so clients cannot
-- directly forge arbitrary order totals or update other customers' orders.
create or replace function public.place_restaurant_order(
  p_table_number int,
  p_customer_name text,
  p_notes text,
  p_items jsonb
) returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_table restaurant_tables%rowtype;
  v_order orders%rowtype;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_food food_items%rowtype;
  v_qty int;
  v_line numeric(10,2);
  v_off numeric(10,2);
  v_code text := 'MH-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,8));
begin
  select * into v_table from restaurant_tables where table_number=p_table_number and active=true;
  if not found then raise exception 'Selected table is not available'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(50, (v_item->>'quantity')::int));
    select * into v_food from food_items where id=(v_item->>'food_item_id')::uuid and available=true and today_available=true;
    if not found then raise exception 'A selected food is unavailable'; end if;
    v_line := v_food.price * v_qty;
    v_off := v_line * v_food.discount_percent / 100;
    v_subtotal := v_subtotal + v_line;
    v_discount := v_discount + v_off;
  end loop;
  v_total := v_subtotal-v_discount;
  insert into orders(order_code,table_id,table_name,customer_name,notes,subtotal,discount_total,grand_total)
  values(v_code,v_table.id,v_table.table_name,left(p_customer_name,100),left(p_notes,500),v_subtotal,v_discount,v_total)
  returning * into v_order;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(50, (v_item->>'quantity')::int));
    select * into v_food from food_items where id=(v_item->>'food_item_id')::uuid;
    v_line := v_food.price*v_qty;
    v_off := v_line*v_food.discount_percent/100;
    insert into order_items(order_id,food_item_id,food_name,quantity,unit_price,discount_percent,line_total)
    values(v_order.id,v_food.id,v_food.name,v_qty,v_food.price,v_food.discount_percent,v_line-v_off);
  end loop;
  return jsonb_build_object('order_id',v_order.id,'order_code',v_order.order_code,'table_name',v_order.table_name,'subtotal',v_subtotal,'discount',v_discount,'total',v_total,'status',v_order.status);
end; $$;
grant execute on function public.place_restaurant_order(int,text,text,jsonb) to anon, authenticated;

-- Enable Realtime for the admin order screen (Supabase Dashboard > Database > Publications if needed).
alter publication supabase_realtime add table public.orders;
