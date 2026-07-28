drop policy if exists "blockouts: read" on blockout_dates;
create policy "blockouts: read" on blockout_dates
  for select using (org_id = current_org_id());
