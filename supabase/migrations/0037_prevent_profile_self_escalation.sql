-- "profiles: update self" (and "profiles: admin manage org members") allow
-- updating your own row, but RLS has no column-level granularity and
-- neither policy has a WITH CHECK restricting which columns change — so any
-- authenticated user could PATCH their own row's is_super_admin/role/org_id
-- directly via the REST API, bypassing every app-level guard entirely.
--
-- SECURITY DEFINER functions (accept_org_invite, join_org_by_token,
-- leave_organization, create_organization, admin_promote_sole_admin_replacement)
-- legitimately change these columns and must stay unaffected — they execute
-- as their (non-'authenticated') owning role, so this trigger only fires for
-- plain client requests, not internal privileged transitions.
create or replace function public.prevent_profile_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.is_super_admin is distinct from old.is_super_admin then
      raise exception 'is_super_admin cannot be changed directly';
    end if;
    if new.id = auth.uid() and (
      new.role is distinct from old.role or
      new.org_id is distinct from old.org_id
    ) then
      raise exception 'You cannot change your own role or organization directly';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_escalation on profiles;
create trigger profiles_prevent_self_escalation
  before update on profiles
  for each row
  execute function public.prevent_profile_self_escalation();
