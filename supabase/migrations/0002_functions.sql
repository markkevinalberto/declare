-- =========================================================================
-- 0002_functions.sql — helper functions, triggers, RPCs
-- =========================================================================

-- ---------------------------------------------------------------------
-- Session helpers (SECURITY DEFINER so RLS policies can call them
-- without recursively re-checking RLS on `profiles`)
-- ---------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql security definer stable
set search_path = public
as $$
  select org_id from profiles where id = auth.uid()
$$;

create or replace function public.current_profile_role()
returns profile_role
language sql security definer stable
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_scheduler()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select coalesce(current_profile_role() in ('admin', 'leader'), false)
$$;

create or replace function public.can_access_thread(p_thread_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from message_threads mt
    where mt.id = p_thread_id
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
$$;

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on service_plan_items
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on positions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- org_id stays null until they create/join an organization.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Create an organization: the calling user becomes its Admin.
-- Runs as SECURITY DEFINER so it can bypass the chicken-and-egg
-- problem of inserting an org before the caller belongs to one.
-- ---------------------------------------------------------------------
create or replace function public.create_organization(p_name text, p_timezone text default 'America/New_York')
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if exists (select 1 from profiles where id = auth.uid() and org_id is not null) then
    raise exception 'You already belong to an organization';
  end if;

  insert into organizations (name, timezone) values (p_name, p_timezone)
  returning id into v_org_id;

  update profiles set org_id = v_org_id, role = 'admin' where id = auth.uid();

  return v_org_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Accept an org invite by token: joins the caller into the inviting
-- organization with the assigned role.
-- ---------------------------------------------------------------------
create or replace function public.accept_org_invite(p_token uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_invite org_invites%rowtype;
begin
  select * into v_invite from org_invites where token = p_token and accepted_at is null;

  if not found then
    raise exception 'Invite not found or already used';
  end if;

  if exists (select 1 from profiles where id = auth.uid() and org_id is not null) then
    raise exception 'You already belong to an organization';
  end if;

  update profiles set org_id = v_invite.org_id, role = v_invite.role where id = auth.uid();
  update org_invites set accepted_at = now() where id = v_invite.id;

  return v_invite.org_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Enforce valid position status transitions for non-schedulers:
-- a member may only flip THEIR OWN row from invited -> accepted/declined.
-- Admins/leaders (schedulers) are unrestricted.
-- ---------------------------------------------------------------------
create or replace function public.enforce_position_transition()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
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

  new.responded_at := now();
  return new;
end;
$$;

create trigger enforce_position_transition
  before update on positions
  for each row execute function public.enforce_position_transition();

-- ---------------------------------------------------------------------
-- Conflict / blockout helper for the scheduling UI.
-- Returns true if the user is already positioned (non-declined) on
-- another service that starts on the same calendar day, or has a
-- blockout date range covering the service date.
-- ---------------------------------------------------------------------
create or replace function public.scheduling_conflicts(p_user_id uuid, p_service_id uuid)
returns table (conflict_type text, detail text)
language sql stable security definer
set search_path = public
as $$
  select 'blockout' as conflict_type, b.reason as detail
  from blockout_dates b
  join services s on s.id = p_service_id
  where b.user_id = p_user_id
    and (s.starts_at at time zone 'utc')::date between b.start_date and b.end_date

  union all

  select 'double_booked' as conflict_type, s2.title as detail
  from positions p
  join services s2 on s2.id = p.service_id
  join services s1 on s1.id = p_service_id
  where p.user_id = p_user_id
    and p.service_id <> p_service_id
    and p.status <> 'declined'
    and (s2.starts_at at time zone 'utc')::date = (s1.starts_at at time zone 'utc')::date;
$$;
