create table if not exists team_projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  unique (team_id, project_id)
);

create table if not exists team_portfolios (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  unique (team_id, portfolio_id)
);

create index if not exists team_projects_team_idx on team_projects (team_id);
create index if not exists team_projects_project_idx on team_projects (project_id);
create index if not exists team_portfolios_team_idx on team_portfolios (team_id);
create index if not exists team_portfolios_portfolio_idx on team_portfolios (portfolio_id);

alter table team_projects enable row level security;
alter table team_portfolios enable row level security;

grant select, insert, update, delete on team_projects to anon, authenticated, service_role;
grant select, insert, update, delete on team_portfolios to anon, authenticated, service_role;

notify pgrst, 'reload schema';
