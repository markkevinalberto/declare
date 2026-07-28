create or replace function public.delete_organization(p_confirm_name text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_org_id uuid := current_org_id();
  v_org_name text;
begin
  if current_profile_role() <> 'admin' then
    raise exception 'Only an admin can delete the organization';
  end if;

  select name into v_org_name from organizations where id = v_org_id;
  if v_org_name is null or p_confirm_name <> v_org_name then
    raise exception 'Confirmation text does not match the organization name';
  end if;

  update profiles set org_id = null, role = 'member' where org_id = v_org_id;

  delete from organizations where id = v_org_id;
end;
$$;

revoke execute on function public.delete_organization(text) from public, anon;
grant execute on function public.delete_organization(text) to authenticated;
