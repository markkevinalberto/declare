-- Shareable org join link: anyone with the link can sign up and join the
-- church as a member — no per-email invite needed. The token lives on the
-- organizations row; regenerating it invalidates previously shared links.

alter table organizations
  add column join_token uuid unique default gen_random_uuid();

-- Anyone with the link (including anonymous visitors on the signup page)
-- can resolve it to a church name.
create or replace function public.get_org_by_join_token(p_token uuid)
returns table (org_name text)
language sql stable security definer
set search_path = public
as $$
  select name as org_name from organizations where join_token = p_token
$$;

revoke execute on function public.get_org_by_join_token(uuid) from public;
grant execute on function public.get_org_by_join_token(uuid) to anon, authenticated;

-- A signed-in user with no org joins as a member.
create or replace function public.join_org_by_token(p_token uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from organizations where join_token = p_token;
  if v_org_id is null then
    raise exception 'This invite link is invalid or has been reset';
  end if;

  if exists (select 1 from profiles where id = auth.uid() and org_id is not null) then
    raise exception 'You already belong to an organization';
  end if;

  update profiles set org_id = v_org_id, role = 'member' where id = auth.uid();
  return v_org_id;
end;
$$;

revoke execute on function public.join_org_by_token(uuid) from public;
grant execute on function public.join_org_by_token(uuid) to authenticated;

-- Admins can rotate the link (e.g. if it leaked beyond the congregation).
create or replace function public.regenerate_join_token()
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if current_profile_role() <> 'admin' then
    raise exception 'Only admins can manage the invite link';
  end if;

  update organizations set join_token = gen_random_uuid()
  where id = current_org_id()
  returning join_token into v_token;
  return v_token;
end;
$$;

revoke execute on function public.regenerate_join_token() from public;
grant execute on function public.regenerate_join_token() to authenticated;
