import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AddTeamPeopleForm,
  AttachTeamWorkForm,
  GrantTeamAccessForm,
} from "@/components/app/TeamForms";
import { Card, Pill } from "@/components/app/ui";
import {
  getOwnedTeamBundle,
  listAccountPeople,
  listMembershipPairs,
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
  const grantableMembers = bundle.members
    .filter((member) => member.person_id !== session.personId)
    .map((member) => member.person);
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
  const access = await listMembershipPairs(
    grantableMembers.map((person) => person.id),
    bundle.projects.map((project) => project.id),
    bundle.portfolios.map((portfolio) => portfolio.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/teams" className="text-[12px] font-medium text-mute hover:text-ink">
          All teams
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{bundle.team.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
          This team has its own members and work. People on other teams can still be added
          here. They will not see anything until you grant access to this team&apos;s
          projects or portfolios.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Members</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {bundle.members.map((member) => {
            const projectNames = bundle.projects
              .filter((project) =>
                access.projects.some(
                  (row) =>
                    row.project_id === project.id && row.person_id === member.person_id,
                ),
              )
              .map((project) => project.name);
            const portfolioNames = bundle.portfolios
              .filter((portfolio) =>
                access.portfolios.some(
                  (row) =>
                    row.portfolio_id === portfolio.id &&
                    row.person_id === member.person_id,
                ),
              )
              .map((portfolio) => portfolio.name);
            const granted = [...portfolioNames, ...projectNames];
            return (
              <div key={member.id} className="rounded-xl bg-foam px-3 py-2">
                <p className="text-sm font-medium">
                  {member.person.full_name}
                  {member.role === "Owner" ? " · Owner" : ""}
                </p>
                <p className="text-[12px] text-mute">{member.person.email}</p>
                <p className="mt-1 text-[12px] text-mute">
                  {member.person_id === session.personId
                    ? "You"
                    : granted.length > 0
                      ? granted.join(" · ")
                      : "No access to this team's work yet"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mb-3 text-sm font-medium">Add existing users</p>
        <AddTeamPeopleForm teamId={id} people={availablePeople} />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">This team's work</h2>
        <p className="mb-4 text-sm leading-6 text-mute">
          Attach projects and portfolios to this team. A project or portfolio can belong
          to more than one team. Attaching it does not give members visibility yet.
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
            <p className="text-sm text-mute">Nothing attached yet.</p>
          ) : null}
        </div>
        <AttachTeamWorkForm
          teamId={id}
          projects={availableProjects}
          portfolios={availablePortfolios}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Grant access</h2>
        <p className="mb-4 text-sm leading-6 text-mute">
          Project access is only that project. Portfolio access includes the portfolio and
          every project inside it.
        </p>
        <GrantTeamAccessForm
          teamId={id}
          members={grantableMembers}
          projects={bundle.projects}
          portfolios={bundle.portfolios}
        />
      </Card>
    </div>
  );
}
