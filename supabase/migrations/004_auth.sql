alter table people add column if not exists industry text;
alter table people add column if not exists country text;

create table if not exists accounts (
  person_id uuid primary key references people(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists accounts_set_updated_at on accounts;
create trigger accounts_set_updated_at
before update on accounts
for each row execute function set_updated_at();

alter table accounts enable row level security;

revoke all on accounts from anon, authenticated;
grant select, insert, update, delete on accounts to service_role;

notify pgrst, 'reload schema';
