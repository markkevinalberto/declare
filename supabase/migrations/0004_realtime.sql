-- =========================================================================
-- 0004_realtime.sql — enable Supabase Realtime on collaboratively-edited
-- and live-updating tables
-- =========================================================================

alter publication supabase_realtime add table service_plan_items;
alter publication supabase_realtime add table positions;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
