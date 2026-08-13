-- Anonymous, first-party event tracking for the administrator dashboard.
-- This intentionally does not store names, email addresses, phone numbers,
-- free-form notes, IP addresses, or the contents of messages.

create table public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_name text not null check (event_name in (
    'page_view',
    'view_item',
    'add_to_space',
    'remove_from_space',
    'generate_lead',
    'contact_whatsapp'
  )),
  page_path text not null check (char_length(page_path) between 1 and 180 and page_path like '/%'),
  session_id uuid not null,
  metadata jsonb not null default '{}'::jsonb
);

create index site_events_created_at_idx on public.site_events (created_at desc);
create index site_events_name_created_at_idx on public.site_events (event_name, created_at desc);

alter table public.site_events enable row level security;

-- The browser may only call this narrow function. It cannot read events or
-- insert arbitrary rows directly. Metadata is explicitly allow-listed.
create or replace function public.track_site_event(
  p_event_name text,
  p_page_path text,
  p_session_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_metadata jsonb;
begin
  if p_event_name not in ('page_view', 'view_item', 'add_to_space', 'remove_from_space', 'generate_lead', 'contact_whatsapp') then
    raise exception 'Unsupported site event' using errcode = '22023';
  end if;

  if p_page_path is null or char_length(p_page_path) not between 1 and 180 or p_page_path not like '/%' then
    raise exception 'Invalid page path' using errcode = '22023';
  end if;

  if p_session_id is null then
    raise exception 'Missing anonymous session' using errcode = '22023';
  end if;

  safe_metadata := jsonb_strip_nulls(jsonb_build_object(
    'item_id', nullif(left(coalesce(p_metadata->>'item_id', ''), 80), ''),
    'item_name', nullif(left(coalesce(p_metadata->>'item_name', ''), 120), ''),
    'item_category', nullif(left(coalesce(p_metadata->>'item_category', ''), 80), ''),
    'room_type', nullif(left(coalesce(p_metadata->>'room_type', ''), 40), ''),
    'location', nullif(left(coalesce(p_metadata->>'location', ''), 80), ''),
    'item_count', case when (p_metadata->>'item_count') ~ '^[0-9]{1,3}$' then (p_metadata->>'item_count')::integer end,
    'value', case when (p_metadata->>'value') ~ '^[0-9]+(\.[0-9]{1,2})?$' then (p_metadata->>'value')::numeric(12,2) end,
    'currency', case when p_metadata->>'currency' = 'USD' then 'USD' end
  ));

  insert into public.site_events (event_name, page_path, session_id, metadata)
  values (p_event_name, p_page_path, p_session_id, safe_metadata);
end;
$$;

-- Only managers may obtain aggregates. Raw visitor event rows remain private.
create or replace function public.site_analytics_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot jsonb;
begin
  if not public.is_catalog_manager() then
    raise exception 'Catalog manager access required' using errcode = '42501';
  end if;

  with recent as (
    select event_name, page_path, session_id
    from public.site_events
    where created_at >= now() - interval '30 minutes'
  ),
  top_events as (
    select event_name as name, count(*)::integer as count
    from recent
    group by event_name
    order by count desc, name asc
    limit 5
  ),
  top_pages as (
    select page_path as name, count(*)::integer as count
    from recent
    where event_name = 'page_view'
    group by page_path
    order by count desc, name asc
    limit 5
  )
  select jsonb_build_object(
    'window', 'last_30_minutes',
    'activeUsers', (select count(distinct session_id) from recent),
    'eventCount', (select count(*) from recent),
    'pageViews', (select count(*) from recent where event_name = 'page_view'),
    'topEvents', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc, name asc) from top_events), '[]'::jsonb),
    'topPages', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc, name asc) from top_pages), '[]'::jsonb),
    'updatedAt', now()
  ) into snapshot;

  return snapshot;
end;
$$;

revoke all on public.site_events from anon, authenticated;
revoke all on function public.track_site_event(text, text, uuid, jsonb) from public;
revoke all on function public.site_analytics_snapshot() from public;
grant execute on function public.track_site_event(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.site_analytics_snapshot() to authenticated;
