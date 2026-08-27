create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('project', 'portfolio')),
  project_id uuid references projects(id) on delete cascade,
  portfolio_id uuid references portfolios(id) on delete cascade,
  actor_id uuid not null references people(id) on delete cascade,
  kind text not null check (kind in ('change', 'view', 'click')),
  action text not null,
  summary text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (project_id is not null or portfolio_id is not null)
);

create index if not exists audit_events_project_idx
  on audit_events (project_id, created_at desc);

create index if not exists audit_events_portfolio_idx
  on audit_events (portfolio_id, created_at desc);

create index if not exists audit_events_actor_idx
  on audit_events (actor_id, created_at desc);

alter table audit_events enable row level security;

grant select, insert, update, delete on audit_events to anon, authenticated, service_role;

notify pgrst, 'reload schema';
