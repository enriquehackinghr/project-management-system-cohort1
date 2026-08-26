create extension if not exists pgcrypto;

do $$ begin
  create type project_status as enum ('planning', 'active', 'on_hold', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'blocked', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role text,
  capacity_hours_per_week numeric not null default 40,
  slack_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  goal text,
  owner_id uuid not null references people(id),
  created_by_id uuid not null references people(id),
  start_date date,
  target_date date,
  status project_status not null default 'planning',
  budget numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role text,
  unique (project_id, person_id)
);

create table if not exists phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  phase_id uuid references phases(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete set null,
  title text not null,
  description text,
  owner_id uuid references people(id) on delete set null,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  estimate_hours numeric,
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_dependencies (
  id uuid primary key default gen_random_uuid(),
  predecessor_id uuid not null references tasks(id) on delete cascade,
  successor_id uuid not null references tasks(id) on delete cascade,
  unique (predecessor_id, successor_id),
  check (predecessor_id <> successor_id)
);

create table if not exists status_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  generated_body text not null,
  body text not null,
  snapshot jsonb not null,
  as_of date not null,
  created_at timestamptz not null default now()
);

create index if not exists project_members_person_idx on project_members (person_id);
create index if not exists project_members_project_idx on project_members (project_id);
create index if not exists phases_project_idx on phases (project_id, sort_order);
create index if not exists tasks_project_idx on tasks (project_id);
create index if not exists tasks_owner_idx on tasks (owner_id);
create index if not exists tasks_phase_idx on tasks (phase_id);
create index if not exists task_dependencies_pred_idx on task_dependencies (predecessor_id);
create index if not exists task_dependencies_succ_idx on task_dependencies (successor_id);
create index if not exists status_reports_project_idx on status_reports (project_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_set_updated_at on people;
create trigger people_set_updated_at
before update on people
for each row execute function set_updated_at();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

alter table people enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table phases enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;
alter table status_reports enable row level security;

create or replace function upsert_person(
  p_full_name text,
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
  insert into people (full_name, email, role, capacity_hours_per_week)
  values (p_full_name, lower(trim(p_email)), p_role, coalesce(p_capacity, 40))
  on conflict (email) do update
    set full_name = excluded.full_name,
        role = coalesce(excluded.role, people.role),
        capacity_hours_per_week = coalesce(excluded.capacity_hours_per_week, people.capacity_hours_per_week)
  returning * into result;
  return result;
end;
$$;

create or replace function commit_project_plan(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created_by uuid;
  v_project_id uuid;
  v_owner_id uuid;
  v_owner_email text;
  v_member jsonb;
  v_phase jsonb;
  v_task jsonb;
  v_dep jsonb;
  v_person_id uuid;
  v_phase_id uuid;
  v_task_id uuid;
  phase_map jsonb := '{}'::jsonb;
  task_map jsonb := '{}'::jsonb;
begin
  v_created_by := (payload->>'created_by_id')::uuid;
  if v_created_by is null then
    raise exception 'created_by_id is required';
  end if;

  v_owner_email := lower(trim(coalesce(payload->'project'->>'owner_email', '')));
  if v_owner_email = '' then
    select email into v_owner_email from people where id = v_created_by;
  end if;

  select id into v_owner_id from people where email = v_owner_email;
  if v_owner_id is null then
    raise exception 'Owner % does not exist. Add them as a member first.', v_owner_email;
  end if;

  insert into projects (
    name, description, goal, owner_id, created_by_id,
    start_date, target_date, status, budget
  )
  values (
    payload->'project'->>'name',
    payload->'project'->>'description',
    payload->'project'->>'goal',
    v_owner_id,
    v_created_by,
    nullif(payload->'project'->>'start_date', '')::date,
    nullif(payload->'project'->>'target_date', '')::date,
    coalesce((payload->'project'->>'status')::project_status, 'planning'),
    nullif(payload->'project'->>'budget', '')::numeric
  )
  returning id into v_project_id;

  for v_member in select * from jsonb_array_elements(coalesce(payload->'members', '[]'::jsonb))
  loop
    insert into people (full_name, email, role, capacity_hours_per_week)
    values (
      v_member->>'full_name',
      lower(trim(v_member->>'email')),
      v_member->>'role',
      coalesce((v_member->>'capacity_hours_per_week')::numeric, 40)
    )
    on conflict (email) do update
      set full_name = excluded.full_name,
          role = coalesce(excluded.role, people.role),
          capacity_hours_per_week = coalesce(excluded.capacity_hours_per_week, people.capacity_hours_per_week)
    returning id into v_person_id;

    insert into project_members (project_id, person_id, role)
    values (v_project_id, v_person_id, v_member->>'role')
    on conflict (project_id, person_id) do update set role = excluded.role;
  end loop;

  insert into project_members (project_id, person_id, role)
  values (v_project_id, v_created_by, 'Creator')
  on conflict (project_id, person_id) do nothing;

  insert into project_members (project_id, person_id, role)
  values (v_project_id, v_owner_id, 'Owner')
  on conflict (project_id, person_id) do nothing;

  for v_phase in select * from jsonb_array_elements(coalesce(payload->'phases', '[]'::jsonb))
  loop
    insert into phases (project_id, name, sort_order, start_date, end_date)
    values (
      v_project_id,
      v_phase->>'name',
      coalesce((v_phase->>'sort_order')::int, 0),
      nullif(v_phase->>'start_date', '')::date,
      nullif(v_phase->>'end_date', '')::date
    )
    returning id into v_phase_id;
    phase_map := phase_map || jsonb_build_object(v_phase->>'temp_id', v_phase_id);
  end loop;

  for v_task in select * from jsonb_array_elements(coalesce(payload->'tasks', '[]'::jsonb))
  loop
    select id into v_person_id
    from people
    where email = lower(trim(coalesce(v_task->>'owner_email', '')));

    insert into tasks (
      project_id, phase_id, title, description, owner_id,
      status, priority, estimate_hours, start_date, due_date
    )
    values (
      v_project_id,
      case
        when coalesce(v_task->>'phase_temp_id', '') = '' then null
        else (phase_map ->> (v_task->>'phase_temp_id'))::uuid
      end,
      v_task->>'title',
      v_task->>'description',
      v_person_id,
      coalesce((v_task->>'status')::task_status, 'todo'),
      coalesce((v_task->>'priority')::task_priority, 'medium'),
      nullif(v_task->>'estimate_hours', '')::numeric,
      nullif(v_task->>'start_date', '')::date,
      nullif(v_task->>'due_date', '')::date
    )
    returning id into v_task_id;
    task_map := task_map || jsonb_build_object(v_task->>'temp_id', v_task_id);
  end loop;

  for v_task in select * from jsonb_array_elements(coalesce(payload->'tasks', '[]'::jsonb))
  loop
    if coalesce(v_task->>'parent_temp_id', '') <> '' then
      update tasks
      set parent_task_id = (task_map ->> (v_task->>'parent_temp_id'))::uuid
      where id = (task_map ->> (v_task->>'temp_id'))::uuid;
    end if;
  end loop;

  for v_dep in select * from jsonb_array_elements(coalesce(payload->'dependencies', '[]'::jsonb))
  loop
    insert into task_dependencies (predecessor_id, successor_id)
    values (
      (task_map ->> (v_dep->>'predecessor_temp_id'))::uuid,
      (task_map ->> (v_dep->>'successor_temp_id'))::uuid
    )
    on conflict do nothing;
  end loop;

  return v_project_id;
end;
$$;

grant execute on function upsert_person(text, text, text, numeric) to service_role;
grant execute on function commit_project_plan(jsonb) to service_role;
