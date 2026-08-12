-- Run this only in existing Supabase projects that already executed 202608120001_catalog.sql.
create table if not exists public.product_color_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color_hex text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  image_storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_color_variants_product_order_idx on public.product_color_variants(product_id, sort_order);

alter table public.product_color_variants enable row level security;

create policy "Visitors can view variants for published products"
on public.product_color_variants for select
using (exists (select 1 from public.products where products.id = product_color_variants.product_id and products.status = 'published'));

create policy "Managers can manage product color variants"
on public.product_color_variants for all
using (public.is_catalog_manager())
with check (public.is_catalog_manager());
