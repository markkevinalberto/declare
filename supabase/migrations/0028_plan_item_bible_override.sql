-- Lets a leader tweak a Bible verse's wording for one service plan only —
-- never touches the source bible (built-in translation or uploaded XML).
alter table public.service_plan_items
  add column bible_verses_override jsonb;
