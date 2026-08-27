create table if not exists task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, person_id)
);

create index if not exists task_assignees_person_idx on task_assignees (person_id);

-- The single owner each task already had becomes its first assignee. This runs
-- before the triggers exist so the backfill cannot rewrite tasks.updated_at,
-- which the risk rules read as "when did this project last move".
insert into task_assignees (task_id, person_id)
select id, owner_id
from tasks
where owner_id is not null
on conflict (task_id, person_id) do nothing;

-- task_assignees is the source of truth. tasks.owner_id is kept in step as the
-- primary assignee so everything that reports on a single accountable person
-- keeps working.
create or replace function sync_task_primary_assignee()
returns trigger
language plpgsql
as $$
declare
  v_task_id uuid;
  v_primary uuid;
begin
  if tg_op = 'DELETE' then
    v_task_id := old.task_id;
  else
    v_task_id := new.task_id;
  end if;

  select person_id into v_primary
  from task_assignees
  where task_id = v_task_id
  order by created_at, id
  limit 1;

  update tasks
  set owner_id = v_primary
  where id = v_task_id and owner_id is distinct from v_primary;

  return null;
end;
$$;

drop trigger if exists task_assignees_sync_primary on task_assignees;
create trigger task_assignees_sync_primary
after insert or delete on task_assignees
for each row execute function sync_task_primary_assignee();

-- commit_project_plan writes tasks.owner_id directly. Seeding from the insert
-- keeps those tasks out of the "nobody is assigned" state without rewriting the
-- whole plan-commit function.
create or replace function seed_task_assignee_from_owner()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is not null then
    insert into task_assignees (task_id, person_id)
    values (new.id, new.owner_id)
    on conflict (task_id, person_id) do nothing;
  end if;
  return null;
end;
$$;

drop trigger if exists tasks_seed_assignee on tasks;
create trigger tasks_seed_assignee
after insert on tasks
for each row execute function seed_task_assignee_from_owner();

alter table task_assignees enable row level security;

grant select, insert, update, delete on task_assignees to anon, authenticated, service_role;

notify pgrst, 'reload schema';
