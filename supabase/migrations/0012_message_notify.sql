-- =========================================================================
-- 0012_message_notify.sql — notify a thread's audience when a new message
-- is posted. A regular member can't INSERT notifications for other users
-- directly (RLS requires user_id = auth.uid() unless you're a scheduler),
-- so this resolves the audience server-side as SECURITY DEFINER, the same
-- pattern used for invite/response notifications.
-- =========================================================================

create or replace function public.notify_thread_message(p_thread_id uuid, p_message_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_thread message_threads%rowtype;
  v_message messages%rowtype;
  v_sender_name text;
  v_recipient record;
begin
  select * into v_thread from message_threads where id = p_thread_id;
  select * into v_message from messages where id = p_message_id and thread_id = p_thread_id;
  if not found then
    return;
  end if;

  select coalesce(name, email) into v_sender_name from profiles where id = v_message.user_id;

  for v_recipient in
    select distinct user_id from (
      select ur.user_id
      from user_roles ur
      join roles r on r.id = ur.role_id
      where v_thread.scope_type = 'role_group' and r.role_group_id = v_thread.scope_id

      union

      select ur.user_id
      from user_roles ur
      where v_thread.scope_type = 'role' and ur.role_id = v_thread.scope_id

      union

      select p.user_id
      from positions p
      where v_thread.scope_type = 'service' and p.service_id = v_thread.scope_id and p.user_id is not null
    ) audience
    where user_id is distinct from v_message.user_id
  loop
    insert into notifications (org_id, user_id, type, title, body, link)
    values (
      v_thread.org_id,
      v_recipient.user_id,
      'message',
      v_sender_name || ' in ' || v_thread.title,
      left(v_message.body, 140),
      '/messages/' || v_thread.id
    );
  end loop;
end;
$$;

revoke execute on function public.notify_thread_message(uuid, uuid) from public;
grant execute on function public.notify_thread_message(uuid, uuid) to authenticated;
