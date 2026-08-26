create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_id uuid not null references people(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  color text not null,
  sort_order integer not null default 0,
  unique (portfolio_id, project_id)
);

create index if not exists portfolios_creator_idx on portfolios (created_by_id, created_at desc);
create index if not exists portfolio_projects_portfolio_idx on portfolio_projects (portfolio_id, sort_order);
create index if not exists portfolio_projects_project_idx on portfolio_projects (project_id);

drop trigger if exists portfolios_set_updated_at on portfolios;
create trigger portfolios_set_updated_at
before update on portfolios
for each row execute function set_updated_at();

alter table portfolios enable row level security;
alter table portfolio_projects enable row level security;

grant select, insert, update, delete on portfolios to anon, authenticated, service_role;
grant select, insert, update, delete on portfolio_projects to anon, authenticated, service_role;

notify pgrst, 'reload schema';
