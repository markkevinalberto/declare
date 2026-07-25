-- Org-uploaded bibles (parsed from Zefania XML files client-side).

create table public.bibles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.bible_verses (
  bible_id uuid not null references public.bibles(id) on delete cascade,
  book int not null,
  chapter int not null,
  verse int not null,
  text text not null,
  primary key (bible_id, book, chapter, verse)
);

alter table public.bibles enable row level security;
alter table public.bible_verses enable row level security;

create policy "bibles: org read" on public.bibles
  for select using (org_id = current_org_id());

create policy "bibles: scheduler write" on public.bibles
  for all using (org_id = current_org_id() and is_scheduler())
  with check (org_id = current_org_id() and is_scheduler());

create policy "bible_verses: org read" on public.bible_verses
  for select using (
    exists (
      select 1 from public.bibles b
      where b.id = bible_id and b.org_id = current_org_id()
    )
  );

create policy "bible_verses: scheduler write" on public.bible_verses
  for all using (
    is_scheduler()
    and exists (
      select 1 from public.bibles b
      where b.id = bible_id and b.org_id = current_org_id()
    )
  )
  with check (
    is_scheduler()
    and exists (
      select 1 from public.bibles b
      where b.id = bible_id and b.org_id = current_org_id()
    )
  );
