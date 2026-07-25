-- =========================================================================
-- 0007_harden_public.sql — 0005 revoked EXECUTE from anon/authenticated
-- specifically, but Postgres also grants EXECUTE to PUBLIC by default on
-- function creation, and anon/authenticated inherit through PUBLIC
-- regardless of a targeted revoke. Revoke from PUBLIC directly so the
-- trigger-only functions are truly unreachable via PostgREST's /rpc.
-- =========================================================================

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.enforce_position_transition() from public;
revoke execute on function public.set_updated_at() from public;
