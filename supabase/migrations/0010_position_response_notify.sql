-- =========================================================================
-- 0010_position_response_notify.sql — let a volunteer's own accept/decline
-- notify their scheduler, without needing the service-role key. Validates
-- internally that the caller is actually the position's assigned user.
-- =========================================================================

create or replace function public.notify_position_response(p_position_id uuid)
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

  insert into notifications (org_id, user_id, type, title, body, link)
  values (
    v_service.org_id,
    v_position.created_by,
    v_position.status::text::notification_type,
    coalesce(v_volunteer.name, v_volunteer.email) || ' ' || v_position.status::text || ' ' || v_role.name,
    v_service.title,
    '/services/' || v_position.service_id
  );
end;
$$;

revoke execute on function public.notify_position_response(uuid) from public;
grant execute on function public.notify_position_response(uuid) to authenticated;
