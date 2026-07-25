-- =========================================================================
-- 0003_rls.sql — Row Level Security policies
-- =========================================================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table org_invites enable row level security;
alter table role_groups enable row level security;
alter table roles enable row level security;
alter table user_roles enable row level security;
alter table service_series enable row level security;
alter table services enable row level security;
alter table service_plan_items enable row level security;
alter table positions enable row level security;
alter table blockout_dates enable row level security;
alter table message_threads enable row level security;
alter table messages enable row level security;
alter table thread_reads enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table reminder_log enable row level security;

-- ---------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------
create policy "org: members can view own org" on organizations
  for select using (id = current_org_id());

create policy "org: admin can update own org" on organizations
  for update using (id = current_org_id() and current_profile_role() = 'admin');

-- inserts happen only through create_organization() (SECURITY DEFINER)

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles: view self or org members" on profiles
  for select using (id = auth.uid() or org_id = current_org_id());

create policy "profiles: update self" on profiles
  for update using (id = auth.uid());

create policy "profiles: admin manage org members" on profiles
  for update using (org_id = current_org_id() and current_profile_role() = 'admin');

-- ---------------------------------------------------------------------
-- org_invites (admin only)
-- ---------------------------------------------------------------------
create policy "invites: admin manage" on org_invites
  for all using (org_id = current_org_id() and current_profile_role() = 'admin')
  with check (org_id = current_org_id() and current_profile_role() = 'admin');

-- ---------------------------------------------------------------------
-- role_groups / roles (admin write, org read)
-- ---------------------------------------------------------------------
create policy "role_groups: org read" on role_groups
  for select using (org_id = current_org_id());

create policy "role_groups: admin write" on role_groups
  for all using (org_id = current_org_id() and current_profile_role() = 'admin')
  with check (org_id = current_org_id() and current_profile_role() = 'admin');

create policy "roles: org read" on roles
  for select using (org_id = current_org_id());

create policy "roles: admin write" on roles
  for all using (org_id = current_org_id() and current_profile_role() = 'admin')
  with check (org_id = current_org_id() and current_profile_role() = 'admin');

-- ---------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------
create policy "user_roles: org read" on user_roles
  for select using (org_id = current_org_id());

create policy "user_roles: admin write" on user_roles
  for all using (org_id = current_org_id() and current_profile_role() = 'admin')
  with check (org_id = current_org_id() and current_profile_role() = 'admin');

-- ---------------------------------------------------------------------
-- service_series / services (scheduler write, org read)
-- ---------------------------------------------------------------------
create policy "service_series: org read" on service_series
  for select using (org_id = current_org_id());

create policy "service_series: scheduler write" on service_series
  for all using (org_id = current_org_id() and is_scheduler())
  with check (org_id = current_org_id() and is_scheduler());

create policy "services: org read" on services
  for select using (org_id = current_org_id());

create policy "services: scheduler write" on services
  for all using (org_id = current_org_id() and is_scheduler())
  with check (org_id = current_org_id() and is_scheduler());

-- ---------------------------------------------------------------------
-- service_plan_items (scoped through parent service's org)
-- ---------------------------------------------------------------------
create policy "plan_items: org read" on service_plan_items
  for select using (
    exists (select 1 from services s where s.id = service_id and s.org_id = current_org_id())
  );

create policy "plan_items: scheduler write" on service_plan_items
  for all using (
    is_scheduler() and exists (select 1 from services s where s.id = service_id and s.org_id = current_org_id())
  )
  with check (
    is_scheduler() and exists (select 1 from services s where s.id = service_id and s.org_id = current_org_id())
  );

-- ---------------------------------------------------------------------
-- positions — drafts hidden from members until invited
-- ---------------------------------------------------------------------
create policy "positions: read" on positions
  for select using (
    org_id = current_org_id()
    and (is_scheduler() or status <> 'draft' or user_id = auth.uid())
  );

create policy "positions: scheduler write" on positions
  for insert with check (org_id = current_org_id() and is_scheduler());

create policy "positions: scheduler delete" on positions
  for delete using (org_id = current_org_id() and is_scheduler());

create policy "positions: update by scheduler or own row" on positions
  for update using (
    org_id = current_org_id()
    and (is_scheduler() or user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- blockout_dates
-- ---------------------------------------------------------------------
create policy "blockouts: read" on blockout_dates
  for select using (
    org_id = current_org_id() and (is_scheduler() or user_id = auth.uid())
  );

create policy "blockouts: write own or scheduler" on blockout_dates
  for all using (
    org_id = current_org_id() and (user_id = auth.uid() or is_scheduler())
  )
  with check (
    org_id = current_org_id() and (user_id = auth.uid() or is_scheduler())
  );

-- ---------------------------------------------------------------------
-- messaging
-- ---------------------------------------------------------------------
create policy "threads: access" on message_threads
  for select using (org_id = current_org_id() and can_access_thread(id));

create policy "threads: scheduler create" on message_threads
  for insert with check (org_id = current_org_id() and is_scheduler());

create policy "threads: scheduler manage" on message_threads
  for update using (org_id = current_org_id() and is_scheduler());

create policy "threads: scheduler delete" on message_threads
  for delete using (org_id = current_org_id() and is_scheduler());

create policy "messages: access" on messages
  for select using (can_access_thread(thread_id));

create policy "messages: post if accessible" on messages
  for insert with check (user_id = auth.uid() and can_access_thread(thread_id));

create policy "thread_reads: own row" on thread_reads
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create policy "notifications: own read" on notifications
  for select using (user_id = auth.uid());

create policy "notifications: own update" on notifications
  for update using (user_id = auth.uid());

create policy "notifications: scheduler or self insert" on notifications
  for insert with check (
    org_id = current_org_id() and (user_id = auth.uid() or is_scheduler())
  );

create policy "notification_prefs: own" on notification_preferences
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
