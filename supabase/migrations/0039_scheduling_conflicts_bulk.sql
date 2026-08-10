-- The "add person to role" popover previously called scheduling_conflicts()
-- once per candidate via a separate Server Action round-trip each — for a
-- role held by N people, opening the popover fired N concurrent requests,
-- each with its own auth check and RPC call. This batches all of them into
-- a single query the popover calls once.
create or replace function public.scheduling_conflicts_bulk(p_user_ids uuid[], p_service_id uuid)
returns table(user_id uuid, conflict_type text, detail text)
language sql stable security definer
set search_path = public
as $$
  select b.user_id, 'blockout' as conflict_type, b.reason as detail
  from blockout_dates b
  join services s on s.id = p_service_id
  where b.user_id = any(p_user_ids)
    and (s.starts_at at time zone 'utc')::date between b.start_date and b.end_date

  union all

  select p.user_id, 'double_booked' as conflict_type, s2.title as detail
  from positions p
  join services s2 on s2.id = p.service_id
  join services s1 on s1.id = p_service_id
  where p.user_id = any(p_user_ids)
    and p.service_id <> p_service_id
    and p.status <> 'declined'
    and (s2.starts_at at time zone 'utc')::date = (s1.starts_at at time zone 'utc')::date;
$$;

revoke execute on function public.scheduling_conflicts_bulk(uuid[], uuid) from public, anon;
grant execute on function public.scheduling_conflicts_bulk(uuid[], uuid) to authenticated;
