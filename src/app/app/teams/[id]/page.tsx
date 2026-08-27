import Link from "next/link";
import { notFound } from "next/navigation";
import { renameTeamAction } from "@/actions/teams";
import { EditableName } from "@/components/app/EditableName";
import {
  AddTeamPeopleForm,
  AddTeamWorkForm,
  DeleteTeamForm,
  RemoveTeamMemberButton,
  TeamMemberRoleSelect,
} from "@/components/app/TeamForms";
import { Card, Pill } from "@/components/app/ui";
import {
  getOwnedTeamBundle,
  listAccountPeople,
  listOwnedPortfolios,
  listOwnedProjects,
} from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [bundle, accountPeople, ownedProjects, ownedPortfolios] = await Promise.all([
    getOwnedTeamBundle(id, session.personId),
    listAccountPeople(session.personId),
    listOwnedProjects(session.personId),
    listOwnedPortfolios(session.personId),
  ]);
  if (!bundle) notFound();

  const memberIds = new Set(bundle.members.map((member) => member.person_id));
  const availablePeople = accountPeople.filter((person) => !memberIds.has(person.id));
  const attachedProjectIds = new Set(bundle.projects.map((project) => project.id));
  const attachedPortfolioIds = new Set(
    bundle.portfolios.map((portfolio) => portfolio.id),
  );
  const availableProjects = ownedProjects.filter(
    (project) => !attachedProjectIds.has(project.id),
  );
  const availablePortfolios = ownedPortfolios.filter(
    (portfolio) => !attachedPortfolioIds.has(portfolio.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/teams" className="text-[12px] font-medium text-mute hover:text-ink">
          All teams
        </Link>
        <div className="mt-2">
          <EditableName
            name={bundle.team.name}
            label="Team name"
            size="page"
            action={renameTeamAction.bind(null, id)}
          />
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
          Add people, then give this team a portfolio or a project. Everyone on the team
          gets access immediately — a portfolio includes every project inside it.
          Removing a person or deleting the team takes that access away.
        </p>
      </div>

      <Card>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Members</h2>
        <p className="mb-4 max-w-2xl text-sm leading-6 text-mute">
          Everyone starts with the view role: they can read this team&apos;s portfolios
          and projects but change nothing. Give someone the admin role to let them edit
          that work. Changing a role emails the person right away.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {bundle.members.map((member) => {
            const isOwner = member.person_id === bundle.team.created_by_id;
            return (
              <div key={member.id} className="rounded-xl bg-foam px-3 py-2">
                <p className="text-sm font-medium">
                  {member.person.full_name}
                  {isOwner ? " · Owner" : ""}
                </p>
                <p className="text-[12px] text-mute">{member.person.email}</p>
                {isOwner ? null : (
                  <>
                    <TeamMemberRoleSelect
                      teamId={id}
                      personId={member.person_id}
                      role={member.access_role}
                    />
                    <RemoveTeamMemberButton
                      teamId={id}
                      personId={member.person_id}
                      name={member.person.full_name}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="mb-3 text-sm font-medium">Add people</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          They need an existing account. If this team already has a portfolio or project,
          they get that access as soon as you add them.
        </p>
        <AddTeamPeopleForm teamId={id} people={availablePeople} />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Access</h2>
        <p className="mb-4 text-sm leading-6 text-mute">
          Add this team to a portfolio, or to a project on its own. Everyone on the team
          will see that work the next time they log in. There is no separate invitation
          email.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {bundle.portfolios.map((portfolio) => (
            <Pill key={portfolio.id}>{portfolio.name}</Pill>
          ))}
          {bundle.projects.map((project) => (
            <span
              key={project.id}
              className="inline-flex items-center rounded-full bg-foam px-2.5 py-1 text-[12px]"
            >
              {project.name}
            </span>
          ))}
          {bundle.projects.length === 0 && bundle.portfolios.length === 0 ? (
            <p className="text-sm text-mute">No portfolio or project yet.</p>
          ) : null}
        </div>
        <AddTeamWorkForm
          teamId={id}
          projects={availableProjects}
          portfolios={availablePortfolios}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Delete team</h2>
        <p className="mb-4 text-sm leading-6 text-mute">
          This removes the team. Members lose the portfolios and projects this team
          gave them, unless another team still grants that access.
        </p>
        <DeleteTeamForm teamId={id} teamName={bundle.team.name} />
      </Card>
    </div>
  );
}
