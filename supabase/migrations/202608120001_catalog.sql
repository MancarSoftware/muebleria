-- Run this migration in the client's Supabase SQL Editor, or via the Supabase CLI.
create type public.catalog_role as enum ('admin', 'editor');
create type public.catalog_product_status as enum ('draft', 'published');
create type public.catalog_inventory_status as enum ('in_stock', 'low_stock', 'made_to_order', 'out_of_stock');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.catalog_role not null default 'editor',
  display_name text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  description text not null check (char_length(description) between 20 and 2000),
  materials text[] not null default '{}',
  dimensions text not null,
  colors text[] not null default '{}',
  tags text[] not null default '{}',
  featured boolean not null default false,
  status public.catalog_product_status not null default 'draft',
  inventory_status public.catalog_inventory_status not null default 'made_to_order',
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_color_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color_hex text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  image_storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index products_published_order_idx on public.products(status, sort_order, created_at desc);
create index product_images_product_order_idx on public.product_images(product_id, sort_order);
create index product_color_variants_product_order_idx on public.product_color_variants(product_id, sort_order);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();

create or replace function public.is_catalog_manager() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'));
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_color_variants enable row level security;

create policy "Managers can view their profile" on public.profiles for select using (id = auth.uid());
create policy "Visitors can view published products" on public.products for select using (status = 'published');
create policy "Managers can manage products" on public.products for all using (public.is_catalog_manager()) with check (public.is_catalog_manager());
create policy "Visitors can view images for published products" on public.product_images for select using (exists (select 1 from public.products where products.id = product_images.product_id and products.status = 'published'));
create policy "Managers can manage product images" on public.product_images for all using (public.is_catalog_manager()) with check (public.is_catalog_manager());
create policy "Visitors can view variants for published products" on public.product_color_variants for select using (exists (select 1 from public.products where products.id = product_color_variants.product_id and products.status = 'published'));
create policy "Managers can manage product color variants" on public.product_color_variants for all using (public.is_catalog_manager()) with check (public.is_catalog_manager());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Managers can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_catalog_manager());
create policy "Managers can update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_catalog_manager());
create policy "Managers can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_catalog_manager());

-- After creating the owner's Supabase Auth account, run this once with their user UUID:
-- insert into public.profiles (id, role, display_name) values ('OWNER_AUTH_USER_UUID', 'admin', 'Casa Nativa owner');
