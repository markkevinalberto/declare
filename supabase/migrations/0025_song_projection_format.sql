-- Per-song projection text formatting (font, size, color…), edited from the
-- presenter console. Null means "use the org-wide projection theme".
alter table public.songs add column projection_format jsonb;
