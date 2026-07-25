-- =========================================================================
-- Church Volunteer Appointment & Service Planning System
-- 0001_schema.sql — core tables, enums, indexes
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type profile_role as enum ('admin', 'leader', 'member');
create type position_status as enum ('draft', 'invited', 'accepted', 'declined');
create type plan_item_type as enum ('header', 'note', 'item');
create type thread_scope as enum ('role_group', 'role', 'service');
create type notification_type as enum (
  'invite', 'accepted', 'declined', 'reminder', 'message',
  'service_updated', 'service_cancelled', 'position_removed'
);
create type recurrence_frequency as enum ('weekly', 'biweekly', 'monthly');

-- ---------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text,
  avatar_url text,
  role profile_role not null default 'member',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index profiles_org_id_idx on profiles (org_id);

-- ---------------------------------------------------------------------
-- Organization invites
-- ---------------------------------------------------------------------
create table org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role profile_role not null default 'member',
  token uuid not null default gen_random_uuid(),
  invited_by uuid not null references profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create index org_invites_token_idx on org_invites (token);
create index org_invites_email_idx on org_invites (lower(email));

-- ---------------------------------------------------------------------
-- Role groups & roles
-- ---------------------------------------------------------------------
create table role_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index role_groups_org_id_idx on role_groups (org_id);

create table roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  role_group_id uuid not null references role_groups(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index roles_org_id_idx on roles (org_id);
create index roles_role_group_id_idx on roles (role_group_id);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create index user_roles_org_id_idx on user_roles (org_id);
create index user_roles_user_id_idx on user_roles (user_id);
create index user_roles_role_id_idx on user_roles (role_id);

-- ---------------------------------------------------------------------
-- Service series (recurrence definition) & services
-- ---------------------------------------------------------------------
create table service_series (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  campus text,
  frequency recurrence_frequency not null default 'weekly',
  day_of_week integer not null default 0, -- 0 = Sunday
  time_of_day time not null default '09:00',
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  series_id uuid references service_series(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  campus text,
  notes text,
  share_token uuid not null default gen_random_uuid(),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index services_org_id_idx on services (org_id);
create index services_starts_at_idx on services (starts_at);
create index services_series_id_idx on services (series_id);
create unique index services_share_token_idx on services (share_token);

-- ---------------------------------------------------------------------
-- Service plan items (the flow)
-- ---------------------------------------------------------------------
create table service_plan_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  type plan_item_type not null default 'item',
  title text not null default '',
  description text,
  duration_minutes integer not null default 0,
  sort_order integer not null default 0,
  assigned_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_plan_items_service_id_idx on service_plan_items (service_id);

-- ---------------------------------------------------------------------
-- Positions (scheduled appointments)
-- ---------------------------------------------------------------------
create table positions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  status position_status not null default 'draft',
  invited_at timestamptz,
  responded_at timestamptz,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index positions_org_id_idx on positions (org_id);
create index positions_service_id_idx on positions (service_id);
create index positions_user_id_idx on positions (user_id);
create index positions_role_id_idx on positions (role_id);

-- ---------------------------------------------------------------------
-- Blockout dates
-- ---------------------------------------------------------------------
create table blockout_dates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index blockout_dates_user_id_idx on blockout_dates (user_id);
create index blockout_dates_range_idx on blockout_dates (start_date, end_date);

-- ---------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------
create table message_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  scope_type thread_scope not null,
  scope_id uuid not null,
  title text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index message_threads_org_id_idx on message_threads (org_id);
create index message_threads_scope_idx on message_threads (scope_type, scope_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references message_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_thread_id_idx on messages (thread_id, created_at);

create table thread_reads (
  thread_id uuid not null references message_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications (user_id, created_at desc);
create index notifications_unread_idx on notifications (user_id) where read_at is null;

create table notification_preferences (
  user_id uuid not null references profiles(id) on delete cascade,
  category notification_type not null,
  email_enabled boolean not null default true,
  primary key (user_id, category)
);

-- ---------------------------------------------------------------------
-- Reminder tracking (avoid duplicate reminder sends)
-- ---------------------------------------------------------------------
create table reminder_log (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references positions(id) on delete cascade,
  kind text not null, -- '3_day' | '1_day'
  sent_at timestamptz not null default now(),
  unique (position_id, kind)
);
