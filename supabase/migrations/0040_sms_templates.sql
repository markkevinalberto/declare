-- Per-org customizable wording for automatic SMS messages (reminders for
-- now — more keys can be added the same way later). Absence of a row for a
-- given (org_id, key) means "use the built-in default" — see
-- src/lib/sms-template-defs.ts for those defaults and {{variable}} names.
create table sms_templates (
  org_id uuid not null references organizations(id) on delete cascade,
  key text not null,
  template text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null,
  primary key (org_id, key)
);

alter table sms_templates enable row level security;

create policy "sms_templates: org read" on sms_templates
  for select using (org_id = current_org_id());

create policy "sms_templates: admin write" on sms_templates
  for all using (org_id = current_org_id() and current_profile_role() = 'admin')
  with check (org_id = current_org_id() and current_profile_role() = 'admin');
