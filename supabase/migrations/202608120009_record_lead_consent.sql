-- Records explicit privacy consent for all future public leads.
-- Apply after migrations 003, 007 and 008.

alter table public.space_proposals
  add column if not exists privacy_policy_version text,
  add column if not exists privacy_accepted_at timestamptz;

create or replace function public.validate_space_proposal_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.privacy_policy_version <> '2026-08-13' or new.privacy_accepted_at is null then
    raise exception 'Explicit privacy consent is required' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists space_proposals_validate_consent on public.space_proposals;
create trigger space_proposals_validate_consent
  before insert on public.space_proposals
  for each row execute function public.validate_space_proposal_consent();

create or replace function public.submit_space_proposal_with_consent(
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
  p_notes text,
  p_privacy_policy_version text
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
    or jsonb_array_length(p_items) not between 1 and 20
    or p_privacy_policy_version <> '2026-08-13' then
    raise exception 'Invalid space proposal' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as requested(product_id uuid, color_name text)
    group by product_id having count(*) > 1
  ) then raise exception 'Duplicate selected product' using errcode = '22023'; end if;

  select jsonb_agg(jsonb_build_object(
      'productId', product.id, 'slug', product.slug, 'name', product.name,
      'category', product.category, 'colorName', nullif(trim(requested.color_name), ''),
      'price', product.price, 'dimensions', product.dimensions
    ) order by product.name), coalesce(sum(product.price), 0), count(*)::integer
  into v_items, v_total_price, v_item_count
  from jsonb_to_recordset(p_items) as requested(product_id uuid, color_name text)
  join public.products product on product.id = requested.product_id and product.status = 'published';

  if v_item_count <> jsonb_array_length(p_items) then
    raise exception 'A selected product is unavailable' using errcode = '22023';
  end if;

  insert into public.space_proposals (
    room_type, room_width_cm, room_depth_cm, budget, total_price,
    required_area_sqm, furniture_footprint_sqm, items, contact_name,
    contact_phone, contact_email, notes, source, privacy_policy_version, privacy_accepted_at
  ) values (
    trim(p_room_type), p_room_width_cm, p_room_depth_cm, p_budget, v_total_price,
    p_required_area_sqm, p_furniture_footprint_sqm, v_items, trim(p_contact_name),
    trim(p_contact_phone), nullif(trim(p_contact_email), ''), nullif(trim(p_notes), ''),
    'space_planner', p_privacy_policy_version, now()
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.submit_contact_inquiry_with_consent(
  p_room_type text,
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_notes text,
  p_privacy_policy_version text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_room_type text := trim(coalesce(p_room_type, ''));
  v_name text := trim(coalesce(p_contact_name, ''));
  v_phone text := trim(coalesce(p_contact_phone, ''));
  v_email text := trim(coalesce(p_contact_email, ''));
  v_notes text := trim(coalesce(p_notes, ''));
begin
  if char_length(v_room_type) not between 2 and 40
    or char_length(v_name) not between 2 and 100
    or v_phone !~ '^[0-9]{10}$'
    or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.]com$'
    or char_length(v_notes) not between 8 and 2000
    or p_privacy_policy_version <> '2026-08-13' then
    raise exception 'Invalid contact inquiry' using errcode = '22023';
  end if;

  insert into public.space_proposals (
    source, room_type, total_price, items, contact_name,
    contact_phone, contact_email, notes, privacy_policy_version, privacy_accepted_at
  ) values (
    'contact_form', v_room_type, 0, '[]'::jsonb, v_name,
    v_phone, v_email, v_notes, p_privacy_policy_version, now()
  ) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_space_proposal(text, numeric, numeric, numeric, numeric, numeric, jsonb, text, text, text, text) from public, anon, authenticated;
revoke all on function public.submit_contact_inquiry(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.submit_space_proposal_with_consent(text, numeric, numeric, numeric, numeric, numeric, jsonb, text, text, text, text, text) from public;
revoke all on function public.submit_contact_inquiry_with_consent(text, text, text, text, text, text) from public;
grant execute on function public.submit_space_proposal_with_consent(text, numeric, numeric, numeric, numeric, numeric, jsonb, text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_contact_inquiry_with_consent(text, text, text, text, text, text) to anon, authenticated;
