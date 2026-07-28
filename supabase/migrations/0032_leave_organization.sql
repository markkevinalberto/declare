create or replace function public.leave_organization()
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_org_id uuid := current_org_id();
  v_uid uuid := auth.uid();
  v_role profile_role := current_profile_role();
  v_promote uuid;
begin
  if v_org_id is null then
    raise exception 'You are not part of an organization';
  end if;

  if v_role = 'admin' and not exists (
    select 1 from profiles
    where org_id = v_org_id and role = 'admin' and id <> v_uid
  ) then
    select id into v_promote
    from profiles
    where org_id = v_org_id and id <> v_uid and active
    order by (role = 'leader') desc, created_at asc
    limit 1;

    if v_promote is not null then
      update profiles set role = 'admin' where id = v_promote;
    end if;
  end if;

  update profiles set org_id = null, role = 'member' where id = v_uid;
end;
$$;

revoke execute on function public.leave_organization() from public, anon;
grant execute on function public.leave_organization() to authenticated;
