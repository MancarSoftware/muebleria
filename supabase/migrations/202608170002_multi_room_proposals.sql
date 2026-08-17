-- Stores a proposal as a set of independently planned environments.
-- Existing direct requests and previous single-room proposals remain valid.

alter table public.space_proposals
  add column if not exists spaces jsonb not null default '[]'::jsonb;

alter table public.space_proposals
  drop constraint if exists space_proposals_spaces_array_check;

alter table public.space_proposals
  add constraint space_proposals_spaces_array_check
  check (jsonb_typeof(spaces) = 'array' and jsonb_array_length(spaces) <= 10);

create or replace function public.submit_space_proposal_with_consent(
  p_room_type text,
  p_room_width_cm numeric,
  p_room_depth_cm numeric,
  p_budget numeric,
  p_required_area_sqm numeric,
  p_furniture_footprint_sqm numeric,
  p_items jsonb,
  p_spaces jsonb,
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
  v_spaces jsonb := '[]'::jsonb;
  v_total_price numeric;
  v_item_count integer;
  v_space_item_count integer;
  v_id uuid;
begin
  if coalesce(char_length(trim(p_contact_name)), 0) < 2
    or trim(coalesce(p_contact_phone, '')) !~ '^[0-9]{10}$'
    or coalesce(char_length(trim(p_room_type)), 0) < 2
    or coalesce(jsonb_typeof(p_items), '') <> 'array'
    or jsonb_array_length(p_items) not between 1 and 20
    or coalesce(jsonb_typeof(p_spaces), '') <> 'array'
    or jsonb_array_length(p_spaces) > 10
    or p_privacy_policy_version <> '2026-08-13' then
    raise exception 'Invalid space proposal' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as requested(product_id uuid, color_name text)
    group by product_id having count(*) > 1
  ) then
    raise exception 'Duplicate selected product' using errcode = '22023';
  end if;

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

  if jsonb_array_length(p_spaces) > 0 then
    if exists (
      select 1
      from jsonb_array_elements(p_spaces) as entry(value)
      cross join lateral jsonb_to_record(case when jsonb_typeof(entry.value) = 'object' then entry.value else '{}'::jsonb end) as room(
        room_type text,
        room_width_cm numeric,
        room_depth_cm numeric,
        budget numeric,
        required_area_sqm numeric,
        furniture_footprint_sqm numeric,
        notes text,
        items jsonb
      )
      where jsonb_typeof(entry.value) <> 'object'
        or char_length(trim(coalesce(room.room_type, ''))) not between 2 and 40
        or coalesce(jsonb_typeof(room.items), '') <> 'array'
        or jsonb_array_length(room.items) not between 1 and 20
        or (room.room_width_cm is not null and room.room_width_cm not between 50 and 5000)
        or (room.room_depth_cm is not null and room.room_depth_cm not between 50 and 5000)
        or (room.budget is not null and room.budget not between 0 and 200000)
        or (room.required_area_sqm is not null and room.required_area_sqm not between 0 and 10000)
        or (room.furniture_footprint_sqm is not null and room.furniture_footprint_sqm not between 0 and 10000)
        or char_length(coalesce(room.notes, '')) > 500
    ) then
      raise exception 'Invalid room breakdown' using errcode = '22023';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_spaces) as entry(value)
      cross join lateral jsonb_to_record(case when jsonb_typeof(entry.value) = 'object' then entry.value else '{}'::jsonb end) as room(items jsonb)
      cross join lateral jsonb_to_recordset(room.items) as requested(product_id uuid, color_name text)
      group by requested.product_id
      having count(*) > 1
    ) then
      raise exception 'A product can only belong to one environment' using errcode = '22023';
    end if;

    select count(*)::integer into v_space_item_count
    from jsonb_array_elements(p_spaces) as entry(value)
    cross join lateral jsonb_to_record(case when jsonb_typeof(entry.value) = 'object' then entry.value else '{}'::jsonb end) as room(items jsonb)
    cross join lateral jsonb_to_recordset(room.items) as requested(product_id uuid, color_name text);

    if v_space_item_count <> jsonb_array_length(p_items)
      or exists (
        select 1
        from jsonb_to_recordset(p_items) as selected_item(product_id uuid, color_name text)
        where not exists (
          select 1
          from jsonb_array_elements(p_spaces) as entry(value)
          cross join lateral jsonb_to_record(case when jsonb_typeof(entry.value) = 'object' then entry.value else '{}'::jsonb end) as room(items jsonb)
          cross join lateral jsonb_to_recordset(room.items) as grouped_item(product_id uuid, color_name text)
          where grouped_item.product_id = selected_item.product_id
        )
      ) then
      raise exception 'Room breakdown must include every selected product once' using errcode = '22023';
    end if;

    select jsonb_agg(jsonb_build_object(
      'roomType', trim(room.room_type),
      'roomWidthCm', room.room_width_cm,
      'roomDepthCm', room.room_depth_cm,
      'budget', room.budget,
      'requiredAreaSqm', room.required_area_sqm,
      'furnitureFootprintSqm', room.furniture_footprint_sqm,
      'notes', nullif(trim(coalesce(room.notes, '')), ''),
      'items', canonical_room.items
    ) order by entry.ordinality)
    into v_spaces
    from jsonb_array_elements(p_spaces) with ordinality as entry(value, ordinality)
    cross join lateral jsonb_to_record(case when jsonb_typeof(entry.value) = 'object' then entry.value else '{}'::jsonb end) as room(
      room_type text,
      room_width_cm numeric,
      room_depth_cm numeric,
      budget numeric,
      required_area_sqm numeric,
      furniture_footprint_sqm numeric,
      notes text,
      items jsonb
    )
    cross join lateral (
      select jsonb_agg(jsonb_build_object(
        'productId', product.id,
        'slug', product.slug,
        'name', product.name,
        'category', product.category,
        'colorName', nullif(trim(requested.color_name), ''),
        'price', product.price,
        'dimensions', product.dimensions
      ) order by product.name) as items
      from jsonb_to_recordset(room.items) as requested(product_id uuid, color_name text)
      join public.products product on product.id = requested.product_id and product.status = 'published'
    ) as canonical_room;
  end if;

  insert into public.space_proposals (
    room_type, room_width_cm, room_depth_cm, budget, total_price,
    required_area_sqm, furniture_footprint_sqm, spaces, items, contact_name,
    contact_phone, contact_email, notes, source, privacy_policy_version, privacy_accepted_at
  ) values (
    trim(p_room_type), p_room_width_cm, p_room_depth_cm, p_budget, v_total_price,
    p_required_area_sqm, p_furniture_footprint_sqm, v_spaces, v_items, trim(p_contact_name),
    trim(p_contact_phone), nullif(trim(p_contact_email), ''), nullif(trim(p_notes), ''),
    'space_planner', p_privacy_policy_version, now()
  ) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_space_proposal_with_consent(text, numeric, numeric, numeric, numeric, numeric, jsonb, jsonb, text, text, text, text, text) from public;
grant execute on function public.submit_space_proposal_with_consent(text, numeric, numeric, numeric, numeric, numeric, jsonb, jsonb, text, text, text, text, text) to anon, authenticated;
