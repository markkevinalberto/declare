-- Per-song formatting already lives on songs.projection_format. Bible plan
-- items aren't reusable entities like songs, so their format lives directly
-- on the plan item instead.
alter table public.service_plan_items
  add column projection_format jsonb;
