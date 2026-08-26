alter table accounts add column if not exists last_login_at timestamptz;
alter table people add column if not exists last_login_at timestamptz;

update accounts
set last_login_at = created_at
where last_login_at is null;

update people as p
set last_login_at = a.last_login_at
from accounts as a
where a.person_id = p.id
  and p.last_login_at is null;

notify pgrst, 'reload schema';
