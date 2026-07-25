-- =========================================================================
-- 0014_simplify_messages_rls.sql — Realtime's postgres_changes
-- authorization check re-evaluates a table's SELECT policy per subscriber.
-- messages' policy went through can_access_thread() -> can_access_scope()
-- -> is_scheduler() -> current_profile_role(), four levels of SECURITY
-- DEFINER nesting. Direct queries evaluated this fine, but Realtime INSERT
-- events for `messages` never reached a subscribed, authorized client
-- (channel showed SUBSCRIBED, no error, but no event delivered even with
-- the filter removed). Inlining the same logic directly in the policy
-- (still calling current_org_id()/is_scheduler(), but skipping the
-- can_access_thread/can_access_scope wrapper layer) is the standard fix
-- for this class of "Realtime silently drops events under complex nested
-- RLS" issue.
-- =========================================================================

drop policy if exists "messages: access" on messages;
create policy "messages: access" on messages
  for select using (
    exists (
      select 1 from message_threads mt
      where mt.id = messages.thread_id
        and mt.org_id = current_org_id()
        and (
          is_scheduler()
          or (mt.scope_type = 'role_group' and exists (
            select 1 from user_roles ur join roles r on r.id = ur.role_id
            where ur.user_id = auth.uid() and r.role_group_id = mt.scope_id
          ))
          or (mt.scope_type = 'role' and exists (
            select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role_id = mt.scope_id
          ))
          or (mt.scope_type = 'service' and exists (
            select 1 from positions p where p.service_id = mt.scope_id and p.user_id = auth.uid()
          ))
        )
    )
  );
