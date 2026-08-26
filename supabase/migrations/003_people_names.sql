alter table people add column if not exists first_name text;
alter table people add column if not exists last_name text;

update people
set
  first_name = coalesce(nullif(split_part(trim(full_name), ' ', 1), ''), trim(full_name), 'Unknown'),
  last_name = coalesce(
    nullif(trim(regexp_replace(trim(full_name), '^\S+\s*', '')), ''),
    ''
  )
where first_name is null or last_name is null;

alter table people alter column first_name set not null;
alter table people alter column last_name set not null;
alter table people alter column last_name set default '';

create or replace function people_sync_names()
returns trigger
language plpgsql
as $$
begin
  new.first_name := trim(coalesce(new.first_name, ''));
  new.last_name := trim(coalesce(new.last_name, ''));
  if new.first_name = '' and coalesce(trim(new.full_name), '') <> '' then
    new.first_name := split_part(trim(new.full_name), ' ', 1);
    new.last_name := trim(regexp_replace(trim(new.full_name), '^\S+\s*', ''));
  end if;
  if new.first_name = '' then
    raise exception 'First name is required.';
  end if;
  new.full_name := trim(both from concat_ws(' ', nullif(new.first_name, ''), nullif(new.last_name, '')));
  return new;
end;
$$;

drop trigger if exists people_sync_names on people;
create trigger people_sync_names
before insert or update on people
for each row execute function people_sync_names();

drop function if exists upsert_person(text, text, text, numeric);

create or replace function upsert_person(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_role text default null,
  p_capacity numeric default 40
)
returns people
language plpgsql
security definer
set search_path = public
as $$
declare
  result people;
begin
  insert into people (first_name, last_name, email, role, capacity_hours_per_week)
  values (
    trim(p_first_name),
    trim(coalesce(p_last_name, '')),
    lower(trim(p_email)),
    p_role,
    coalesce(p_capacity, 40)
  )
  on conflict (email) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        role = coalesce(excluded.role, people.role),
        capacity_hours_per_week = coalesce(excluded.capacity_hours_per_week, people.capacity_hours_per_week)
  returning * into result;
  return result;
end;
$$;

notify pgrst, 'reload schema';
