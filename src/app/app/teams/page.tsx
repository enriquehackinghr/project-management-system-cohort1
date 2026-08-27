import Link from "next/link";
import { CreateTeamModal } from "@/components/app/TeamForms";
import { EmptyState, PageHeader, Pill } from "@/components/app/ui";
import {
  listAccountPeople,
  listOwnedTeams,
  listTeamMembers,
  listTeamPortfolios,
  listTeamProjects,
  syncOwnedTeamsAccess,
} from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function TeamsPage() {
  const session = await requireSession();
  await syncOwnedTeamsAccess(session.personId);
  const [teams, people] = await Promise.all([
    listOwnedTeams(session.personId),
    listAccountPeople(session.personId),
  ]);
  const teamIds = teams.map((team) => team.id);
  const [members, teamProjects, teamPortfolios] = await Promise.all([
    listTeamMembers(teamIds),
    listTeamProjects(teamIds),
    listTeamPortfolios(teamIds),
  ]);

  return (
    <div>
      <PageHeader
        kicker="Teams"
        title="Your teams"
        description="Create a team, add people, then give them a portfolio or a project. The same person can sit on more than one team."
        actions={<CreateTeamModal people={people} />}
      />
      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          body="Create a team, add people who already have an account, then give them a portfolio or a project. They will see that work the next time they log in."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => {
            const teamMembers = members.filter((member) => member.team_id === team.id);
            const attachedProjects = teamProjects.filter((row) => row.team_id === team.id);
            const attachedPortfolios = teamPortfolios.filter(
              (row) => row.team_id === team.id,
            );
            return (
              <Link
                key={team.id}
                href={`/app/teams/${team.id}`}
                className="rounded-2xl border border-flour bg-white p-5 transition hover:border-crust/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{team.name}</h2>
                  <Pill>
                    {teamMembers.length} member{teamMembers.length === 1 ? "" : "s"}
                  </Pill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-mute">No members yet.</p>
                  ) : (
                    teamMembers.map((member) => (
                      <span
                        key={member.id}
                        className="inline-flex items-center rounded-full bg-foam px-2.5 py-1 text-[12px]"
                      >
                        {member.person.full_name}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachedPortfolios.map((row) => (
                    <Pill key={row.portfolio.id}>{row.portfolio.name}</Pill>
                  ))}
                  {attachedProjects.map((row) => (
                    <span
                      key={row.project.id}
                      className="inline-flex items-center rounded-full bg-foam px-2.5 py-1 text-[12px] text-mute"
                    >
                      {row.project.name}
                    </span>
                  ))}
                  {attachedProjects.length === 0 && attachedPortfolios.length === 0 ? (
                    <p className="text-[12px] text-mute">
                      No portfolio or project yet.
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
