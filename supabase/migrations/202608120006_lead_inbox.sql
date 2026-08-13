-- Private sales follow-up history for the proposals captured in 003.
-- Apply this after 202608120003_space_proposals.sql.

alter table public.space_proposals
  add column if not exists updated_at timestamptz not null default now();

update public.space_proposals
set updated_at = created_at
where updated_at is null;

drop trigger if exists space_proposals_set_updated_at on public.space_proposals;
create trigger space_proposals_set_updated_at
  before update on public.space_proposals
  for each row execute function public.set_updated_at();

create table if not exists public.space_proposal_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  proposal_id uuid not null references public.space_proposals(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  activity_type text not null check (activity_type in ('status_change', 'note')),
  from_status text check (from_status is null or from_status in ('new', 'contacted', 'qualified', 'closed', 'archived')),
  to_status text check (to_status is null or to_status in ('new', 'contacted', 'qualified', 'closed', 'archived')),
  note text check (note is null or char_length(note) between 1 and 1000)
);

create index if not exists space_proposal_activities_proposal_created_idx
  on public.space_proposal_activities (proposal_id, created_at desc);

alter table public.space_proposal_activities enable row level security;

drop policy if exists "Catalog managers can view proposal activities" on public.space_proposal_activities;
create policy "Catalog managers can view proposal activities"
  on public.space_proposal_activities for select to authenticated
  using (public.is_catalog_manager());

drop policy if exists "Catalog managers can add proposal activities" on public.space_proposal_activities;
create policy "Catalog managers can add proposal activities"
  on public.space_proposal_activities for insert to authenticated
  with check (public.is_catalog_manager());

revoke all on public.space_proposal_activities from anon;
grant select, insert on public.space_proposal_activities to authenticated;

create or replace function public.update_space_proposal_lead(
  p_proposal_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  previous_status text;
  trimmed_note text;
begin
  if not public.is_catalog_manager() then
    raise exception 'Catalog manager access required' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('new', 'contacted', 'qualified', 'closed', 'archived') then
    raise exception 'Invalid lead status' using errcode = '22023';
  end if;

  trimmed_note := nullif(trim(coalesce(p_note, '')), '');
  if trimmed_note is not null and char_length(trimmed_note) > 1000 then
    raise exception 'Lead note is too long' using errcode = '22023';
  end if;

  select status into previous_status
  from public.space_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'Proposal not found' using errcode = 'P0002';
  end if;

  update public.space_proposals
  set status = p_status
  where id = p_proposal_id;

  if previous_status is distinct from p_status then
    insert into public.space_proposal_activities (proposal_id, actor_id, activity_type, from_status, to_status)
    values (p_proposal_id, auth.uid(), 'status_change', previous_status, p_status);
  end if;

  if trimmed_note is not null then
    insert into public.space_proposal_activities (proposal_id, actor_id, activity_type, note)
    values (p_proposal_id, auth.uid(), 'note', trimmed_note);
  end if;
end;
$$;

revoke all on function public.update_space_proposal_lead(uuid, text, text) from public;
grant execute on function public.update_space_proposal_lead(uuid, text, text) to authenticated;
