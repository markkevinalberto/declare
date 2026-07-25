-- =========================================================================
-- 0019_allow_response_change.sql — volunteers can change their mind.
-- Previously a member could only flip their own row invited -> accepted or
-- invited -> declined, making a response final. Now they may also switch
-- between accepted and declined (their own row only; drafts still
-- untouchable). responded_at is re-stamped on every response change.
-- =========================================================================

create or replace function public.enforce_position_transition()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status
     and old.status in ('invited', 'accepted', 'declined')
     and new.status in ('accepted', 'declined') then
    new.responded_at := now();
  end if;

  if public.is_scheduler() then
    return new;
  end if;

  if old.user_id is distinct from auth.uid() or new.user_id is distinct from auth.uid() then
    raise exception 'Not authorized to modify this position';
  end if;

  if new.role_id <> old.role_id or new.service_id <> old.service_id then
    raise exception 'Not authorized to modify this position';
  end if;

  if not (
    old.status in ('invited', 'accepted', 'declined')
    and new.status in ('accepted', 'declined')
  ) then
    raise exception 'Invalid status transition';
  end if;

  return new;
end;
$$;
