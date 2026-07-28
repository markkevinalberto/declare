-- The public shared-plan view (get_shared_service) rendered dates in the
-- viewer's local timezone instead of the organization's own timezone,
-- so a service listed as "9:00 AM" could show as a different time to a
-- volunteer viewing the shared link from another timezone. Expose the
-- org's timezone so the client can format consistently.
drop function if exists public.get_shared_service(uuid);

create function public.get_shared_service(p_token uuid)
returns table(
  id uuid,
  title text,
  starts_at timestamptz,
  campus text,
  notes text,
  org_name text,
  timezone text
)
language sql stable security definer
set search_path = public
as $$
  select s.id, s.title, s.starts_at, s.campus, s.notes, o.name as org_name, o.timezone
  from services s
  join organizations o on o.id = s.org_id
  where s.share_token = p_token
$$;

revoke all on function public.get_shared_service(uuid) from public, anon;
grant execute on function public.get_shared_service(uuid) to anon, authenticated;
