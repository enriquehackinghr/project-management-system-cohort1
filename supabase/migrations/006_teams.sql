create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_id uuid not null references people(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role text,
  unique (team_id, person_id)
);

create table if not exists portfolio_members (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  role text,
  unique (portfolio_id, person_id)
);

create index if not exists teams_creator_idx on teams (created_by_id, created_at desc);
create index if not exists team_members_team_idx on team_members (team_id);
create index if not exists team_members_person_idx on team_members (person_id);
create index if not exists portfolio_members_portfolio_idx on portfolio_members (portfolio_id);
create index if not exists portfolio_members_person_idx on portfolio_members (person_id);

drop trigger if exists teams_set_updated_at on teams;
create trigger teams_set_updated_at
before update on teams
for each row execute function set_updated_at();

insert into portfolio_members (portfolio_id, person_id, role)
select id, created_by_id, 'Owner'
from portfolios
on conflict (portfolio_id, person_id) do nothing;

alter table teams enable row level security;
alter table team_members enable row level security;
alter table portfolio_members enable row level security;

grant select, insert, update, delete on teams to anon, authenticated, service_role;
grant select, insert, update, delete on team_members to anon, authenticated, service_role;
grant select, insert, update, delete on portfolio_members to anon, authenticated, service_role;

notify pgrst, 'reload schema';
