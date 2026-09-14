-- Weekly Bible devotional broadcast: an org-managed content library, a
-- per-org opt-in toggle, and a dedup log for the cron send
-- (src/app/api/cron/devotionals/route.ts) that goes out every Sunday at
-- 6am the org's own local time — the same single-daily-cron-tick +
-- per-org-timezone-check pattern reminders already use (see reminder_log
-- below and src/app/api/cron/reminders/route.ts).

alter table organizations
  add column devotionals_enabled boolean not null default false;

alter type notification_type add value 'devotional';

create table devotionals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  scripture_reference text not null,
  scripture_text text,
  reflection text not null,
  sort_order int not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index devotionals_org_id_idx on devotionals (org_id, sort_order);

alter table devotionals enable row level security;

create policy "devotionals: org read" on devotionals
  for select using (org_id = current_org_id());

create policy "devotionals: admin write" on devotionals
  for all using (org_id = current_org_id() and current_profile_role() = 'admin')
  with check (org_id = current_org_id() and current_profile_role() = 'admin');

-- Dedup log keyed by the org's own local calendar date, so a daily cron
-- tick that happens to land on Sunday for a given org's timezone only ever
-- sends once for that date even if the cron reruns. No RLS policies (same
-- as reminder_log) — only the service-role cron client ever touches this.
create table devotional_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  devotional_id uuid references devotionals(id) on delete set null,
  sent_on date not null,
  recipient_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, sent_on)
);

alter table devotional_log enable row level security;
