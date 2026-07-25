-- =========================================================================
-- 0009_realtime_replica_identity.sql — Supabase Realtime's filtered
-- postgres_changes subscriptions (e.g. `service_id=eq.X`) need the OLD row
-- data to evaluate the filter on UPDATE/DELETE. With the default replica
-- identity (primary key only), UPDATE/DELETE payloads don't include the
-- filtered column, so those events get silently dropped for subscribers.
-- REPLICA IDENTITY FULL includes the whole old row, fixing this for every
-- realtime-enabled table.
-- =========================================================================

alter table service_plan_items replica identity full;
alter table positions replica identity full;
alter table messages replica identity full;
alter table notifications replica identity full;
