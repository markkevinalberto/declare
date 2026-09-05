-- Free-text fields rather than a profile reference: the preacher or giving
-- exhorter for a given Sunday is very often a guest speaker who has no
-- account in the system at all.
alter table services
  add column preacher_name text,
  add column giving_exhorter_name text,
  add column sermon_slides_url text;
