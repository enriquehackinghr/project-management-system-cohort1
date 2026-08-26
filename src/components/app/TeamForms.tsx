"use client";

import {
  addPeopleToTeamAction,
  addTeamPeopleToPortfolioAction,
  addTeamPeopleToProjectAction,
  attachWorkToTeamAction,
  createTeamAction,
  grantTeamAccessAction,
} from "@/actions/teams";
import type { Person, Portfolio, Project } from "@/lib/types";
import { CheckboxGroup, PersonPicker } from "./PersonPicker";
import { Field, inputClass, PrimaryButton } from "./ui";

export function CreateTeamForm({
  people,
  projects,
  portfolios,
}: {
  people: Person[];
  projects: Project[];
  portfolios: Portfolio[];
}) {
  return (
    <form action={createTeamAction} className="space-y-4">
      <Field label="Team name">
        <input className={inputClass} name="name" required placeholder="Product squad" />
      </Field>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Members</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          You are added as owner. The same person can be on more than one of your teams.
        </p>
        <PersonPicker
          people={people}
          emptyLabel="No other users on the platform yet. They appear here after they sign up."
        />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Projects</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          Optional. Members still will not see a project until you grant access on the team.
        </p>
        <CheckboxGroup
          name="projectId"
          emptyLabel="You have no projects to attach yet."
          items={projects.map((project) => ({
            id: project.id,
            label: project.name,
            hint: project.goal || project.description || undefined,
          }))}
        />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Portfolios</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          Optional. Members still will not see a portfolio until you grant access on the team.
        </p>
        <CheckboxGroup
          name="portfolioId"
          emptyLabel="You have no portfolios to attach yet."
          items={portfolios.map((portfolio) => ({
            id: portfolio.id,
            label: portfolio.name,
          }))}
        />
      </div>
      <PrimaryButton type="submit">Create team</PrimaryButton>
    </form>
  );
}

export function AddTeamPeopleForm({
  teamId,
  people,
}: {
  teamId: string;
  people: Person[];
}) {
  const action = addPeopleToTeamAction.bind(null, teamId);
  return (
    <form action={action} className="space-y-4">
      <PersonPicker
        people={people}
        emptyLabel="Everyone else is already on this team. People on other teams can still be added here."
      />
      {people.length > 0 ? (
        <PrimaryButton type="submit">Add selected</PrimaryButton>
      ) : null}
    </form>
  );
}

export function GrantTeamAccessForm({
  teamId,
  members,
  projects,
  portfolios,
}: {
  teamId: string;
  members: Person[];
  projects: Project[];
  portfolios: Portfolio[];
}) {
  const action = grantTeamAccessAction.bind(null, teamId);
  const canGrant = members.length > 0 && (projects.length > 0 || portfolios.length > 0);

  return (
    <form action={action} className="space-y-6">
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">People</p>
        <PersonPicker
          people={members}
          emptyLabel="Add people to the team first."
        />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Projects</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          Selected people will only see these projects from this team.
        </p>
        <CheckboxGroup
          name="projectId"
          emptyLabel="Add a project to this team first."
          items={projects.map((project) => ({
            id: project.id,
            label: project.name,
            hint: project.goal || project.description || undefined,
          }))}
        />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Portfolios</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          Selected people will see this team&apos;s portfolio and each project in it.
        </p>
        <CheckboxGroup
          name="portfolioId"
          emptyLabel="Add a portfolio to this team first."
          items={portfolios.map((portfolio) => ({
            id: portfolio.id,
            label: portfolio.name,
          }))}
        />
      </div>
      {canGrant ? <PrimaryButton type="submit">Grant access</PrimaryButton> : null}
    </form>
  );
}

export function AttachTeamWorkForm({
  teamId,
  projects,
  portfolios,
}: {
  teamId: string;
  projects: Project[];
  portfolios: Portfolio[];
}) {
  const action = attachWorkToTeamAction.bind(null, teamId);
  const canAttach = projects.length > 0 || portfolios.length > 0;
  return (
    <form action={action} className="space-y-6">
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Projects</p>
        <CheckboxGroup
          name="projectId"
          emptyLabel="Every project you own is already on this team."
          items={projects.map((project) => ({
            id: project.id,
            label: project.name,
            hint: project.goal || project.description || undefined,
          }))}
        />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Portfolios</p>
        <CheckboxGroup
          name="portfolioId"
          emptyLabel="Every portfolio you own is already on this team."
          items={portfolios.map((portfolio) => ({
            id: portfolio.id,
            label: portfolio.name,
          }))}
        />
      </div>
      {canAttach ? <PrimaryButton type="submit">Add to this team</PrimaryButton> : null}
    </form>
  );
}

export function AddPeopleToWorkForm({
  actionId,
  kind,
  people,
}: {
  actionId: string;
  kind: "project" | "portfolio";
  people: Person[];
}) {
  const action =
    kind === "project"
      ? addTeamPeopleToProjectAction.bind(null, actionId)
      : addTeamPeopleToPortfolioAction.bind(null, actionId);

  if (people.length === 0) {
    return (
      <p className="text-sm text-mute">
        {kind === "project"
          ? "Everyone from your teams is already on this project, or you have no team members to add yet."
          : "Everyone from your teams already has access, or you have no team members to add yet."}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <PersonPicker people={people} />
      <PrimaryButton type="submit">Add selected</PrimaryButton>
    </form>
  );
}
