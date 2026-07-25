-- A free-form text slide a leader can type anything into and project —
-- announcements, a welcome message, anything that isn't a song or verse.
alter type plan_item_type add value if not exists 'content';
alter table public.service_plan_items add column content_text text;
