-- =========================================================================
-- 0011_fix_responded_at.sql — enforce_position_transition only stamped
-- responded_at on the non-scheduler code path. A scheduler who also holds
-- a role and responds to their own invite (common in small churches) hit
-- the "is_scheduler() -> return new" bypass first and never got
-- responded_at set. Stamp it based on the actual status change instead,
-- regardless of who's making it.
-- =========================================================================

create or replace function public.enforce_position_transition()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status
     and old.status = 'invited'
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

  if not (old.status = 'invited' and new.status in ('accepted', 'declined')) then
    raise exception 'Invalid status transition';
  end if;

  return new;
end;
$$;
