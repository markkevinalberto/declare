-- =========================================================================
-- 0015_notification_preferences.sql — let a caller check ANY org member's
-- email preference for a category (needed when a leader sends an invite
-- and must check the VOLUNTEER's preference, not their own). Defaults to
-- true (email enabled) when no explicit row exists, matching the app's
-- "opt-out" model.
-- =========================================================================

create or replace function public.get_email_preference(p_user_id uuid, p_category notification_type)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select email_enabled from notification_preferences where user_id = p_user_id and category = p_category),
    true
  )
$$;

revoke execute on function public.get_email_preference(uuid, notification_type) from public;
grant execute on function public.get_email_preference(uuid, notification_type) to authenticated;
