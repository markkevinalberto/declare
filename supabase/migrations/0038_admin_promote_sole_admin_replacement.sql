-- adminDeleteUser's "is this the org's only admin?" check and the actual
-- deleteUser() call happen as separate, non-transactional steps in JS.
-- Deleting two different admins of the same 2-admin org in quick succession
-- can race: both requests see "another admin still exists" before either
-- deletion has actually happened, so both skip promotion, leaving the org
-- with zero admins. An advisory lock scoped to the org id serializes the
-- check-and-promote decision across concurrent calls for the same org.
create or replace function public.admin_promote_sole_admin_replacement(p_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role profile_role;
  v_promote uuid;
begin
  if not current_profile_is_super_admin() then
    raise exception 'Only a super admin can call this';
  end if;

  select org_id, role into v_org_id, v_role from profiles where id = p_user_id;
  if v_org_id is null or v_role <> 'admin' then
    return;
  end if;

  -- Held for the rest of this transaction — blocks a concurrent call for
  -- the same org until this one commits.
  perform pg_advisory_xact_lock(hashtext(v_org_id::text));

  if exists (
    select 1 from profiles
    where org_id = v_org_id and role = 'admin' and id <> p_user_id
  ) then
    return;
  end if;

  select id into v_promote
  from profiles
  where org_id = v_org_id and id <> p_user_id and active
  order by (role = 'leader') desc, created_at asc
  limit 1;

  if v_promote is not null then
    update profiles set role = 'admin' where id = v_promote;
  end if;
end;
$$;

revoke execute on function public.admin_promote_sole_admin_replacement(uuid) from public, anon;
grant execute on function public.admin_promote_sole_admin_replacement(uuid) to authenticated;
