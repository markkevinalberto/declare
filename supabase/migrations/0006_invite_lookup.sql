-- =========================================================================
-- 0006_invite_lookup.sql — allow anonymous/unaffiliated visitors to look
-- up a pending invite by its (unguessable) token, without needing the
-- service-role key in the app. Safe: only returns data tied to a valid,
-- unaccepted invite token.
-- =========================================================================

create or replace function public.get_org_invite(p_token uuid)
returns table (email text, role profile_role, org_name text, accepted boolean)
language sql stable security definer
set search_path = public
as $$
  select i.email, i.role, o.name as org_name, (i.accepted_at is not null) as accepted
  from org_invites i
  join organizations o on o.id = i.org_id
  where i.token = p_token
$$;

grant execute on function public.get_org_invite(uuid) to anon, authenticated;
