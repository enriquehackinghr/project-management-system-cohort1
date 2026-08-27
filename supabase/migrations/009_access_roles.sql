alter table team_members
  add column if not exists access_role text not null default 'view';
alter table project_members
  add column if not exists access_role text not null default 'view';
alter table portfolio_members
  add column if not exists access_role text not null default 'view';

alter table team_members drop constraint if exists team_members_access_role_check;
alter table team_members
  add constraint team_members_access_role_check check (access_role in ('view', 'admin'));

alter table project_members drop constraint if exists project_members_access_role_check;
alter table project_members
  add constraint project_members_access_role_check check (access_role in ('view', 'admin'));

alter table portfolio_members drop constraint if exists portfolio_members_access_role_check;
alter table portfolio_members
  add constraint portfolio_members_access_role_check check (access_role in ('view', 'admin'));

-- Every existing membership starts as view. Owners and creators keep admin so
-- nobody loses control of work they already run.
update team_members tm
set access_role = 'admin'
from teams t
where t.id = tm.team_id and t.created_by_id = tm.person_id;

update project_members pm
set access_role = 'admin'
from projects p
where p.id = pm.project_id
  and (p.owner_id = pm.person_id or p.created_by_id = pm.person_id);

update portfolio_members pom
set access_role = 'admin'
from portfolios po
where po.id = pom.portfolio_id and po.created_by_id = pom.person_id;

create index if not exists project_members_person_idx on project_members (person_id);

notify pgrst, 'reload schema';
