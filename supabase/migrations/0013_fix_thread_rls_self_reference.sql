-- =========================================================================
-- 0013_fix_thread_rls_self_reference.sql — the message_threads SELECT
-- policy called can_access_thread(id), which re-queries message_threads
-- BY ID to look up scope_type/scope_id. That self-referential subquery has
-- a same-transaction visibility gotcha: `insert ... returning` (used by
-- every ORM/client that does .insert().select()) evaluates the SELECT
-- policy against the just-inserted, not-yet-externally-visible row, and
-- the nested SECURITY DEFINER subquery back into message_threads failed to
-- see it — reproducibly: a bare INSERT succeeded, the identical INSERT
-- with RETURNING failed with "new row violates row-level security policy".
--
-- Fix: give the message_threads policy direct access to the row's own
-- scope_type/scope_id columns instead of re-querying itself by id. Add
-- can_access_scope() taking scope_type/scope_id directly, and rebuild
-- can_access_thread() on top of it for messages/thread_reads, which look
-- up an *existing* (already-committed) thread and don't hit this bug.
-- =========================================================================

create or replace function public.can_access_scope(p_scope_type thread_scope, p_scope_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    is_scheduler()
    or (p_scope_type = 'role_group' and exists (
      select 1 from user_roles ur join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.role_group_id = p_scope_id
    ))
    or (p_scope_type = 'role' and exists (
      select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role_id = p_scope_id
    ))
    or (p_scope_type = 'service' and exists (
      select 1 from positions p where p.service_id = p_scope_id and p.user_id = auth.uid()
    ))
$$;

create or replace function public.can_access_thread(p_thread_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from message_threads mt
    where mt.id = p_thread_id
      and mt.org_id = current_org_id()
      and can_access_scope(mt.scope_type, mt.scope_id)
  )
$$;

drop policy if exists "threads: access" on message_threads;
create policy "threads: access" on message_threads
  for select using (
    org_id = current_org_id()
    and can_access_scope(scope_type, scope_id)
  );

revoke execute on function public.can_access_scope(thread_scope, uuid) from public;
grant execute on function public.can_access_scope(thread_scope, uuid) to authenticated;
