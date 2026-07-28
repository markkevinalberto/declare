alter table profiles add column if not exists is_super_admin boolean not null default false;

create or replace function public.current_profile_is_super_admin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select coalesce(is_super_admin, false) from profiles where id = auth.uid()
$$;

update profiles set is_super_admin = true
where email in ('markkevinalberto@gmail.com', 'mark.kevin.alberto@jcsgo.org');
