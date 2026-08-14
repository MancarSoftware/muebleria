-- Enforce Ecuador's local 10-digit mobile format for every new lead.
-- This is safe for existing demo records: it validates only future inserts.

create or replace function public.validate_ecuador_lead_phone()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.contact_phone !~ '^[0-9]{10}$' then
    raise exception 'An Ecuador phone number must have exactly 10 digits' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists space_proposals_validate_ecuador_phone on public.space_proposals;
create trigger space_proposals_validate_ecuador_phone
  before insert on public.space_proposals
  for each row execute function public.validate_ecuador_lead_phone();
