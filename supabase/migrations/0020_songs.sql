-- =========================================================================
-- 0020_songs.sql — song library.
-- Org-scoped songs (title, artist, key, BPM, CCLI, lyrics, YouTube link)
-- plus service plan integration: plan items can now be type 'song' and
-- reference a library song (with a per-service key override).
-- =========================================================================

create table songs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  artist text,
  default_key text,
  bpm integer,
  ccli_number text,
  youtube_url text,
  lyrics text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index songs_org_id_idx on songs (org_id);
create index songs_title_idx on songs (org_id, lower(title));

alter table songs enable row level security;

create policy "songs: org read" on songs
  for select using (org_id = current_org_id());

create policy "songs: scheduler write" on songs
  for all using (org_id = current_org_id() and is_scheduler())
  with check (org_id = current_org_id() and is_scheduler());

-- Plan integration
alter type plan_item_type add value if not exists 'song';

alter table service_plan_items
  add column song_id uuid references songs(id) on delete set null,
  add column song_key text;
