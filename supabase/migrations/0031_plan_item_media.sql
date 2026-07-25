-- Media plan items: an image, photo slideshow, or video projected from the
-- presenter. The files themselves stay on the presenter's machine (IndexedDB)
-- and are NEVER uploaded — the plan only stores the file list (names/types)
-- so any device can show what the item contains and prompt the operator to
-- attach the files locally.
alter type plan_item_type add value if not exists 'media';

alter table service_plan_items
  add column if not exists media_config jsonb;
