-- =========================================================================
-- seed.sql — demo data: 1 church, ~15 users, 3 role groups, 4 services,
-- a couple of blockout dates, and a sample message thread
--
-- Password for every seeded user is: password123
--
-- NOTE: this inserts directly into auth.users, which requires running
-- against the Postgres connection with the `postgres` role (Supabase
-- SQL Editor, or `supabase db reset` locally) — it will NOT work through
-- the anon/service REST API. Intended for local development / demos only.
-- Run against a FRESH database — it is not idempotent.
-- =========================================================================

do $$
declare
  v_org_id uuid := '00000000-0000-0000-0000-000000000001';
  v_admin_id uuid := '00000000-0000-0000-0000-000000000010';
  v_leader1_id uuid := '00000000-0000-0000-0000-000000000011';
  v_leader2_id uuid := '00000000-0000-0000-0000-000000000012';
  v_member_ids uuid[] := array[
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000025',
    '00000000-0000-0000-0000-000000000026',
    '00000000-0000-0000-0000-000000000027',
    '00000000-0000-0000-0000-000000000028',
    '00000000-0000-0000-0000-000000000029',
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000031'
  ];
  v_member_names text[] := array[
    'Alex Rivera','Jamie Chen','Taylor Brooks','Morgan Diaz','Casey Kim',
    'Jordan Lee','Riley Nguyen','Sam Patel','Drew Foster','Peyton Gray',
    'Avery Cole','Reese Bennett'
  ];
  v_wg_id uuid := '00000000-0000-0000-0000-000000000101'; -- Worship Team
  v_tg_id uuid := '00000000-0000-0000-0000-000000000102'; -- Tech Team
  v_hg_id uuid := '00000000-0000-0000-0000-000000000103'; -- Hospitality

  v_role_vocals uuid := '00000000-0000-0000-0000-000000000201';
  v_role_drums uuid := '00000000-0000-0000-0000-000000000202';
  v_role_bass uuid := '00000000-0000-0000-0000-000000000203';
  v_role_keys uuid := '00000000-0000-0000-0000-000000000204';
  v_role_sound uuid := '00000000-0000-0000-0000-000000000205';
  v_role_projection uuid := '00000000-0000-0000-0000-000000000206';
  v_role_usher uuid := '00000000-0000-0000-0000-000000000207';
  v_role_greeter uuid := '00000000-0000-0000-0000-000000000208';

  v_series_id uuid := '00000000-0000-0000-0000-000000000301';
  v_service_ids uuid[] := array[
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000404'
  ];
  v_next_sunday date;
  i int;
  v_uid uuid;
begin
  -- next upcoming Sunday
  v_next_sunday := current_date + ((7 - extract(dow from current_date)::int) % 7 + 7) % 7 * interval '1 day';
  if v_next_sunday <= current_date then
    v_next_sunday := v_next_sunday + interval '7 day';
  end if;

  -- ---- auth.users + profiles -------------------------------------------
  -- NOTE: confirmation_token / recovery_token / email_change* must be ''
  -- (not NULL) or GoTrue fails to parse the row during login.
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current)
  values
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@gracechurch.demo', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Pat Morgan"}', 'authenticated', 'authenticated', '', '', '', '', ''),
    (v_leader1_id, '00000000-0000-0000-0000-000000000000', 'worship.leader@gracechurch.demo', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Jordan Ellis"}', 'authenticated', 'authenticated', '', '', '', '', ''),
    (v_leader2_id, '00000000-0000-0000-0000-000000000000', 'tech.leader@gracechurch.demo', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sam Whitfield"}', 'authenticated', 'authenticated', '', '', '', '', '');

  for i in 1 .. array_length(v_member_ids, 1) loop
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current)
    values (
      v_member_ids[i], '00000000-0000-0000-0000-000000000000',
      lower(replace(v_member_names[i], ' ', '.')) || '@gracechurch.demo',
      crypt('password123', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', v_member_names[i]),
      'authenticated', 'authenticated', '', '', '', '', ''
    );
  end loop;

  insert into organizations (id, name, timezone) values (v_org_id, 'Grace Community Church', 'America/New_York');

  update profiles set org_id = v_org_id, role = 'admin', name = 'Pat Morgan' where id = v_admin_id;
  update profiles set org_id = v_org_id, role = 'leader', name = 'Jordan Ellis' where id = v_leader1_id;
  update profiles set org_id = v_org_id, role = 'leader', name = 'Sam Whitfield' where id = v_leader2_id;

  for i in 1 .. array_length(v_member_ids, 1) loop
    update profiles set org_id = v_org_id, role = 'member', name = v_member_names[i] where id = v_member_ids[i];
  end loop;

  -- ---- role groups & roles ----------------------------------------------
  insert into role_groups (id, org_id, name, sort_order) values
    (v_wg_id, v_org_id, 'Worship Team', 0),
    (v_tg_id, v_org_id, 'Tech Team', 1),
    (v_hg_id, v_org_id, 'Hospitality', 2);

  insert into roles (id, org_id, role_group_id, name, sort_order) values
    (v_role_vocals, v_org_id, v_wg_id, 'Vocals', 0),
    (v_role_drums, v_org_id, v_wg_id, 'Drums', 1),
    (v_role_bass, v_org_id, v_wg_id, 'Bass', 2),
    (v_role_keys, v_org_id, v_wg_id, 'Keys', 3),
    (v_role_sound, v_org_id, v_tg_id, 'Sound', 0),
    (v_role_projection, v_org_id, v_tg_id, 'Projection', 1),
    (v_role_usher, v_org_id, v_hg_id, 'Usher', 0),
    (v_role_greeter, v_org_id, v_hg_id, 'Greeter', 1);

  -- spread members across roles, a few each
  insert into user_roles (org_id, user_id, role_id)
  select v_org_id, v_member_ids[gs.n], r
  from generate_series(1, 12) as gs(n),
       lateral (
         select case (gs.n % 8)
           when 0 then v_role_vocals when 1 then v_role_drums when 2 then v_role_bass
           when 3 then v_role_keys when 4 then v_role_sound when 5 then v_role_projection
           when 6 then v_role_usher else v_role_greeter
         end as r
       ) x;

  insert into user_roles (org_id, user_id, role_id)
  select v_org_id, v_member_ids[gs.n], r
  from generate_series(1, 12) as gs(n),
       lateral (
         select case ((gs.n + 3) % 8)
           when 0 then v_role_vocals when 1 then v_role_drums when 2 then v_role_bass
           when 3 then v_role_keys when 4 then v_role_sound when 5 then v_role_projection
           when 6 then v_role_usher else v_role_greeter
         end as r
       ) x
  on conflict do nothing;

  -- ---- service series + 4 upcoming services -------------------------------
  insert into service_series (id, org_id, title, campus, frequency, day_of_week, time_of_day)
  values (v_series_id, v_org_id, 'Sunday Worship', 'Main Campus', 'weekly', 0, '09:00');

  for i in 1 .. 4 loop
    insert into services (id, org_id, series_id, title, starts_at, campus, notes, created_by)
    values (
      v_service_ids[i], v_org_id, v_series_id, 'Sunday Worship',
      (v_next_sunday + ((i - 1) * 7)) + time '09:00',
      'Main Campus', 'Weekly Sunday morning service', v_leader1_id
    );

    insert into service_plan_items (service_id, type, title, description, duration_minutes, sort_order)
    values
      (v_service_ids[i], 'header', 'Pre-Service', null, 0, 0),
      (v_service_ids[i], 'item', 'Welcome & Announcements', null, 5, 1),
      (v_service_ids[i], 'item', 'Worship Set', '3 songs', 20, 2),
      (v_service_ids[i], 'item', 'Offering', null, 5, 3),
      (v_service_ids[i], 'item', 'Sermon', null, 30, 4),
      (v_service_ids[i], 'item', 'Closing Song', null, 5, 5),
      (v_service_ids[i], 'note', 'Communion this week', 'Set up trays before service', 0, 6);
  end loop;

  -- ---- positions on the first two services, mixed statuses --------------
  insert into positions (org_id, service_id, role_id, user_id, status, invited_at, responded_at, created_by)
  values
    (v_org_id, v_service_ids[1], v_role_vocals, v_member_ids[1], 'accepted', now() - interval '2 day', now() - interval '1 day', v_leader1_id),
    (v_org_id, v_service_ids[1], v_role_drums, v_member_ids[2], 'invited', now() - interval '1 day', null, v_leader1_id),
    (v_org_id, v_service_ids[1], v_role_sound, v_member_ids[5], 'declined', now() - interval '2 day', now() - interval '1 day', v_leader2_id),
    (v_org_id, v_service_ids[1], v_role_usher, v_member_ids[9], 'draft', null, null, v_leader1_id),
    (v_org_id, v_service_ids[2], v_role_vocals, v_member_ids[3], 'accepted', now() - interval '3 day', now() - interval '2 day', v_leader1_id),
    (v_org_id, v_service_ids[2], v_role_projection, v_member_ids[6], 'invited', now() - interval '1 day', null, v_leader2_id);

  -- notification preferences default (all on) are implied by absence of rows;
  -- app treats missing rows as "email enabled".

  -- ---- blockout dates ----------------------------------------------------
  insert into blockout_dates (org_id, user_id, start_date, end_date, reason) values
    (v_org_id, v_member_ids[1], v_next_sunday + 14, v_next_sunday + 14, 'Family trip'),
    (v_org_id, v_member_ids[3], v_next_sunday + 7, v_next_sunday + 21, 'Out of town');

  -- ---- a sample message thread --------------------------------------------
  declare
    v_thread_id uuid := '00000000-0000-0000-0000-000000000501';
  begin
    insert into message_threads (id, org_id, scope_type, scope_id, title, created_by)
    values (v_thread_id, v_org_id, 'role_group', v_wg_id, 'Worship Team', v_leader1_id);

    insert into messages (thread_id, user_id, body, created_at) values
      (v_thread_id, v_leader1_id, 'Hey team, excited for Sunday!', now() - interval '1 day'),
      (v_thread_id, v_member_ids[1], 'Looking forward to it!', now() - interval '20 hour');
  end;

end $$;
