-- Platform-wide settings, controlled by a super admin rather than any one
-- org's admin — the SMS gateway is a single shared resource (one physical
-- phone/SIM via AkeriusSMS), not something that makes sense to toggle
-- per-org. Singleton row pattern: id is always true, so there can only
-- ever be exactly one row.
create table app_settings (
  id boolean primary key default true check (id),
  sms_reminders_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

insert into app_settings (id) values (true);

alter table app_settings enable row level security;

create policy "app_settings: super admin read" on app_settings
  for select using (current_profile_is_super_admin());

create policy "app_settings: super admin write" on app_settings
  for update using (current_profile_is_super_admin())
  with check (current_profile_is_super_admin());
