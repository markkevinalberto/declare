-- =========================================================================
-- 0021_self_signup.sql — a volunteer can pick an open role themselves and
-- go straight to "accepted", skipping the draft -> invite -> accept flow.
-- Only allowed for roles they already hold (granted by an admin on the
-- Roles page) and only for a role they don't already have a position for
-- on that service.
-- =========================================================================

create policy "positions: self signup" on positions
  for insert
  with check (
    org_id = current_org_id()
    and user_id = auth.uid()
    and created_by = auth.uid()
    and status = 'accepted'
    and exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role_id = role_id
        and ur.org_id = current_org_id()
    )
  );

-- Notifies the service's creator (not the volunteer themselves — they
-- already know) that someone signed themselves up.
create or replace function public.notify_self_signup(p_position_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_position positions%rowtype;
  v_service services%rowtype;
  v_role roles%rowtype;
  v_volunteer profiles%rowtype;
begin
  select * into v_position from positions where id = p_position_id;
  if not found or v_position.user_id is distinct from auth.uid() then
    raise exception 'Not authorized';
  end if;

  select * into v_service from services where id = v_position.service_id;
  select * into v_role from roles where id = v_position.role_id;
  select * into v_volunteer from profiles where id = v_position.user_id;

  if v_service.created_by is distinct from v_position.user_id then
    insert into notifications (org_id, user_id, type, title, body, link)
    values (
      v_service.org_id,
      v_service.created_by,
      'accepted',
      coalesce(v_volunteer.name, v_volunteer.email) || ' signed up for ' || v_role.name,
      v_service.title,
      '/services/' || v_position.service_id
    );
  end if;
end;
$$;

revoke execute on function public.notify_self_signup(uuid) from public;
grant execute on function public.notify_self_signup(uuid) to authenticated;
