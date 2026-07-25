-- Projection theme settings (one row per org) + storage for slide backgrounds.

create table public.projection_settings (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.projection_settings enable row level security;

create policy "projection_settings: org read" on public.projection_settings
  for select using (org_id = current_org_id());

create policy "projection_settings: scheduler write" on public.projection_settings
  for all using (org_id = current_org_id() and is_scheduler())
  with check (org_id = current_org_id() and is_scheduler());

-- Storage bucket for still/video backgrounds. Public read so the projector
-- window can load media without signed URLs; writes are org-scoped to
-- schedulers via the first folder segment (= org id).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'projection-backgrounds',
  'projection-backgrounds',
  true,
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

create policy "projection bg: scheduler upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'projection-backgrounds'
    and is_scheduler()
    and (storage.foldername(name))[1] = current_org_id()::text
  );

create policy "projection bg: scheduler delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'projection-backgrounds'
    and is_scheduler()
    and (storage.foldername(name))[1] = current_org_id()::text
  );

create policy "projection bg: org list" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'projection-backgrounds'
    and (storage.foldername(name))[1] = current_org_id()::text
  );
