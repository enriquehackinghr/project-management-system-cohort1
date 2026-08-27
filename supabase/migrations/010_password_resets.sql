-- Only the SHA-256 of the reset token is stored. A leaked table dump cannot be
-- replayed as a reset link, and the plaintext token only ever lives in the
-- email we send.
create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_resets_person_idx
  on password_resets (person_id, created_at desc);

alter table password_resets enable row level security;

revoke all on password_resets from anon, authenticated;
grant select, insert, update, delete on password_resets to service_role;

notify pgrst, 'reload schema';
