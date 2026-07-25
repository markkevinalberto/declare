-- =========================================================================
-- 0008_public_plan.sql — allow anonymous visitors to view a service's plan
-- via its unguessable share_token, without needing the service-role key.
-- =========================================================================

create or replace function public.get_shared_service(p_token uuid)
returns table (
  id uuid,
  title text,
  starts_at timestamptz,
  campus text,
  notes text,
  org_name text
)
language sql stable security definer
set search_path = public
as $$
  select s.id, s.title, s.starts_at, s.campus, s.notes, o.name as org_name
  from services s
  join organizations o on o.id = s.org_id
  where s.share_token = p_token
$$;

create or replace function public.get_shared_service_plan_items(p_token uuid)
returns table (
  id uuid,
  type plan_item_type,
  title text,
  description text,
  duration_minutes integer,
  sort_order integer
)
language sql stable security definer
set search_path = public
as $$
  select i.id, i.type, i.title, i.description, i.duration_minutes, i.sort_order
  from service_plan_items i
  join services s on s.id = i.service_id
  where s.share_token = p_token
  order by i.sort_order
$$;

grant execute on function public.get_shared_service(uuid) to anon, authenticated;
grant execute on function public.get_shared_service_plan_items(uuid) to anon, authenticated;
