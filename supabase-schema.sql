-- My Hotel backend starter schema (not yet connected to this ZIP frontend)
create extension if not exists pgcrypto;
create table if not exists public.hotel_settings(id boolean primary key default true check(id),hotel_name text not null default 'My Hotel',tagline text,welcome_message text,phone text,address text,updated_at timestamptz default now());
create table if not exists public.food_categories(id uuid primary key default gen_random_uuid(),name text unique not null,enabled boolean default true);
create table if not exists public.restaurant_tables(id uuid primary key default gen_random_uuid(),table_name text unique not null,enabled boolean default true);
create table if not exists public.food_items(id uuid primary key default gen_random_uuid(),category_id uuid references public.food_categories(id),name text not null,description text,image_url text,price numeric(10,2) not null check(price>=0),discount_percent numeric(5,2) default 0 check(discount_percent between 0 and 100),show_today boolean default true,enabled boolean default true);
create table if not exists public.restaurant_orders(id uuid primary key default gen_random_uuid(),order_number text unique not null,table_label text not null,status text default 'Pending',payment_method text default 'Cash at Counter',subtotal numeric(10,2),discount_total numeric(10,2),grand_total numeric(10,2),created_at timestamptz default now());
create table if not exists public.restaurant_order_items(id uuid primary key default gen_random_uuid(),order_id uuid references public.restaurant_orders(id) on delete cascade,item_name text not null,unit_price numeric(10,2),discount_percent numeric(5,2),quantity int check(quantity>0),line_total numeric(10,2));
alter table public.hotel_settings enable row level security; alter table public.food_categories enable row level security; alter table public.restaurant_tables enable row level security; alter table public.food_items enable row level security; alter table public.restaurant_orders enable row level security; alter table public.restaurant_order_items enable row level security;
create policy "public read settings" on public.hotel_settings for select using(true);
create policy "public read categories" on public.food_categories for select using(enabled);
create policy "public read tables" on public.restaurant_tables for select using(enabled);
create policy "public read menu" on public.food_items for select using(enabled and show_today);
-- Add secure authenticated admin policies and a server-side order RPC/Edge Function before production.
-- Never expose Supabase service_role keys in browser code.
