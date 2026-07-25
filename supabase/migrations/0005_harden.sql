-- =========================================================================
-- 0005_harden.sql — lock down function EXECUTE grants flagged by the
-- Supabase security advisor after 0002-0004.
-- =========================================================================

-- Trigger-only functions should never be invocable directly via
-- PostgREST's /rpc endpoint.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.enforce_position_transition() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;

-- set_updated_at didn't have a pinned search_path (function_search_path_mutable lint).
alter function public.set_updated_at() set search_path = public;

-- Helper/RPC functions are meant for signed-in org members only — never
-- anonymous callers.
revoke execute on function public.current_org_id() from anon;
revoke execute on function public.current_profile_role() from anon;
revoke execute on function public.is_scheduler() from anon;
revoke execute on function public.can_access_thread(uuid) from anon;
revoke execute on function public.scheduling_conflicts(uuid, uuid) from anon;
revoke execute on function public.create_organization(text, text) from anon;
revoke execute on function public.accept_org_invite(uuid) from anon;
