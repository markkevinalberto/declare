-- Bible verses become first-class, orderable items in the service plan —
-- clickable to project from the schedule board, same as songs.
alter type plan_item_type add value if not exists 'bible';
