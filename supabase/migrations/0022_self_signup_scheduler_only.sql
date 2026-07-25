-- =========================================================================
-- 0022_self_signup_scheduler_only.sql — restrict self sign-up to leaders
-- and admins. Regular members go back to the invite -> accept/decline
-- flow only; they can no longer insert their own accepted position.
-- =========================================================================

drop policy "positions: self signup" on positions;

create policy "positions: self signup" on positions
  for insert
  with check (
    org_id = current_org_id()
    and user_id = auth.uid()
    and created_by = auth.uid()
    and status = 'accepted'
    and public.is_scheduler()
    and exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role_id = role_id
        and ur.org_id = current_org_id()
    )
  );
