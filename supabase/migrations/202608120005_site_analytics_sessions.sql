-- Adds session-aware visits to the anonymous analytics introduced in 004.
-- Apply this after 202608120004_site_analytics.sql.

alter table public.site_events drop constraint if exists site_events_event_name_check;
alter table public.site_events add constraint site_events_event_name_check check (event_name in (
  'session_start',
  'page_view',
  'view_item',
  'add_to_space',
  'remove_from_space',
  'generate_lead',
  'contact_whatsapp'
));

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
  if p_event_name not in ('session_start', 'page_view', 'view_item', 'add_to_space', 'remove_from_space', 'generate_lead', 'contact_whatsapp') then
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
    where event_name not in ('session_start', 'page_view')
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
    'visits', (select count(*) from recent where event_name = 'session_start'),
    'eventCount', (select count(*) from recent),
    'pageViews', (select count(*) from recent where event_name = 'page_view'),
    'interactions', (select count(*) from recent where event_name not in ('session_start', 'page_view')),
    'topEvents', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc, name asc) from top_events), '[]'::jsonb),
    'topPages', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc, name asc) from top_pages), '[]'::jsonb),
    'updatedAt', now()
  ) into snapshot;

  return snapshot;
end;
$$;

revoke all on function public.track_site_event(text, text, uuid, jsonb) from public;
revoke all on function public.site_analytics_snapshot() from public;
grant execute on function public.track_site_event(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.site_analytics_snapshot() to authenticated;
