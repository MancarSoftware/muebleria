-- Allows the public contact form to use the same protected inbox as space proposals.
-- Apply this after 202608120003_space_proposals.sql and 202608120006_lead_inbox.sql.

alter table public.space_proposals
  drop constraint if exists space_proposals_items_check;

alter table public.space_proposals
  add constraint space_proposals_items_check check (
    jsonb_typeof(items) = 'array'
    and (
      (source = 'space_planner' and jsonb_array_length(items) between 1 and 20)
      or (source = 'contact_form' and jsonb_array_length(items) = 0)
    )
  );

create or replace function public.submit_contact_inquiry(
  p_room_type text,
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_notes text
)
returns uuid
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
    or v_phone !~ '^[0-9]{7,15}$'
    or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.]com$'
    or char_length(v_notes) not between 8 and 2000 then
    raise exception 'Invalid contact inquiry' using errcode = '22023';
  end if;

  insert into public.space_proposals (
    source, room_type, total_price, items,
    contact_name, contact_phone, contact_email, notes
  ) values (
    'contact_form', v_room_type, 0, '[]'::jsonb,
    v_name, v_phone, v_email, v_notes
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_inquiry(text, text, text, text, text) from public;
grant execute on function public.submit_contact_inquiry(text, text, text, text, text) to anon, authenticated;
