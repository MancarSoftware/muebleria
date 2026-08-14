create table if not exists public.space_proposals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'space_planner' check (source in ('space_planner', 'contact_form')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'archived')),
  room_type text not null check (char_length(room_type) between 2 and 40),
  room_width_cm numeric check (room_width_cm is null or room_width_cm between 50 and 5000),
  room_depth_cm numeric check (room_depth_cm is null or room_depth_cm between 50 and 5000),
  budget numeric check (budget is null or budget >= 0),
  total_price numeric not null check (total_price >= 0),
  required_area_sqm numeric check (required_area_sqm is null or required_area_sqm >= 0),
  furniture_footprint_sqm numeric check (furniture_footprint_sqm is null or furniture_footprint_sqm >= 0),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  contact_phone text not null check (contact_phone ~ '^[0-9]{10}$'),
  contact_email text check (contact_email is null or char_length(contact_email) <= 254),
  notes text check (notes is null or char_length(notes) <= 2000)
);

create index if not exists space_proposals_created_at_idx on public.space_proposals (created_at desc);
create index if not exists space_proposals_status_idx on public.space_proposals (status, created_at desc);

alter table public.space_proposals enable row level security;

create policy "Catalog managers can manage space proposals"
  on public.space_proposals for all to authenticated
  using (public.is_catalog_manager())
  with check (public.is_catalog_manager());

-- The client never inserts directly into this table. This protects the lead from
-- a modified browser payload and lets the function persist catalog-authoritative
-- names, dimensions and prices.
revoke insert on public.space_proposals from anon, authenticated;
grant select, update, delete on public.space_proposals to authenticated;

create or replace function public.submit_space_proposal(
  p_room_type text,
  p_room_width_cm numeric,
  p_room_depth_cm numeric,
  p_budget numeric,
  p_required_area_sqm numeric,
  p_furniture_footprint_sqm numeric,
  p_items jsonb,
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb;
  v_total_price numeric;
  v_item_count integer;
  v_id uuid;
begin
  if coalesce(char_length(trim(p_contact_name)), 0) < 2
    or trim(coalesce(p_contact_phone, '')) !~ '^[0-9]{10}$'
    or coalesce(char_length(trim(p_room_type)), 0) < 2
    or coalesce(jsonb_typeof(p_items), '') <> 'array'
    or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Invalid space proposal' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as requested(product_id uuid, color_name text)
    group by product_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate selected product' using errcode = '22023';
  end if;

  select
    jsonb_agg(jsonb_build_object(
      'productId', product.id,
      'slug', product.slug,
      'name', product.name,
      'category', product.category,
      'colorName', nullif(trim(requested.color_name), ''),
      'price', product.price,
      'dimensions', product.dimensions
    ) order by product.name),
    coalesce(sum(product.price), 0),
    count(*)::integer
  into v_items, v_total_price, v_item_count
  from jsonb_to_recordset(p_items) as requested(product_id uuid, color_name text)
  join public.products product on product.id = requested.product_id and product.status = 'published';

  if v_item_count <> jsonb_array_length(p_items) then
    raise exception 'A selected product is unavailable' using errcode = '22023';
  end if;

  insert into public.space_proposals (
    room_type, room_width_cm, room_depth_cm, budget, total_price,
    required_area_sqm, furniture_footprint_sqm, items,
    contact_name, contact_phone, contact_email, notes, source
  ) values (
    trim(p_room_type), p_room_width_cm, p_room_depth_cm, p_budget, v_total_price,
    p_required_area_sqm, p_furniture_footprint_sqm, v_items,
    trim(p_contact_name), trim(p_contact_phone), nullif(trim(p_contact_email), ''), nullif(trim(p_notes), ''), 'space_planner'
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_space_proposal(text, numeric, numeric, numeric, numeric, numeric, jsonb, text, text, text, text) from public;
grant execute on function public.submit_space_proposal(text, numeric, numeric, numeric, numeric, numeric, jsonb, text, text, text, text) to anon, authenticated;
