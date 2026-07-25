-- Let a signed-in user (who has no org yet) discover pending invites sent
-- to their email address, so onboarding can offer "Join <church>" instead
-- of only "create a new church".
create or replace function public.get_my_pending_invites()
returns table (token uuid, org_name text, role profile_role, created_at timestamptz)
language sql stable security definer
set search_path = public
as $$
  select i.token, o.name as org_name, i.role, i.created_at
  from org_invites i
  join organizations o on o.id = i.org_id
  where i.accepted_at is null
    and lower(i.email) = lower(coalesce(auth.jwt()->>'email', ''))
$$;

revoke execute on function public.get_my_pending_invites() from public;
grant execute on function public.get_my_pending_invites() to authenticated;
