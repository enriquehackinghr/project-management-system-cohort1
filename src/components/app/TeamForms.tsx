"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addPeopleToTeamAction,
  addTeamPeopleToPortfolioAction,
  addTeamPeopleToProjectAction,
  addTeamToWorkAction,
  createTeamAction,
  deleteTeamAction,
  removeTeamMemberAction,
  setTeamMemberRoleAction,
} from "@/actions/teams";
import {
  ACCESS_ROLE_HINT,
  ACCESS_ROLE_LABEL,
  ACCESS_ROLES,
  type AccessRole,
  type Person,
  type Portfolio,
  type Project,
} from "@/lib/types";
import { CheckboxGroup, PersonPicker } from "./PersonPicker";
import { Field, inputClass, PrimaryButton, SecondaryButton } from "./ui";

export function CreateTeamModal({ people }: { people: Person[] }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        Create New Team
      </PrimaryButton>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-flour bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-flour px-6 py-5">
              <div>
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  Create New Team
                </h2>
                <p className="mt-1 text-sm leading-6 text-mute">
                  Name the team and add people. Next you can give them a portfolio or a
                  project.
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-mute hover:text-ink"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              <CreateTeamForm people={people} onCancel={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CreateTeamForm({
  people,
  onCancel,
}: {
  people: Person[];
  onCancel: () => void;
}) {
  return (
    <form action={createTeamAction} className="space-y-4">
      <Field label="Team name">
        <input className={inputClass} name="name" required placeholder="Product squad" />
      </Field>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Members</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          You are added as owner. Pick people who already have an account — they are
          added immediately.
        </p>
        <PersonPicker
          people={people}
          emptyLabel="No other users on the platform yet. They appear here after they sign up."
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <PrimaryButton type="submit">Create team</PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </div>
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

export function AddTeamWorkForm({
  teamId,
  projects,
  portfolios,
}: {
  teamId: string;
  projects: Project[];
  portfolios: Portfolio[];
}) {
  const action = addTeamToWorkAction.bind(null, teamId);
  const canAdd = projects.length > 0 || portfolios.length > 0;

  return (
    <form action={action} className="space-y-6">
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Portfolios</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          Everyone on this team gets the portfolio and every project inside it.
        </p>
        <CheckboxGroup
          name="portfolioId"
          emptyLabel="Every portfolio you own is already on this team."
          items={portfolios.map((portfolio) => ({
            id: portfolio.id,
            label: portfolio.name,
          }))}
        />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-mute">Or a single project</p>
        <p className="mb-3 text-[13px] leading-5 text-mute">
          Use this when someone only needs one project, not a whole portfolio.
        </p>
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
      {canAdd ? <PrimaryButton type="submit">Give access</PrimaryButton> : null}
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

export function TeamMemberRoleSelect({
  teamId,
  personId,
  role,
}: {
  teamId: string;
  personId: string;
  role: AccessRole;
}) {
  const router = useRouter();
  const selectId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-2">
      <label htmlFor={selectId} className="sr-only">
        Role
      </label>
      <select
        id={selectId}
        value={role}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as AccessRole;
          setError(null);
          startTransition(async () => {
            try {
              await setTeamMemberRoleAction(teamId, personId, next);
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not change this role.",
              );
            }
          });
        }}
        className="h-8 rounded-lg border border-flour bg-white px-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ACCESS_ROLES.map((option) => (
          <option key={option} value={option}>
            {ACCESS_ROLE_LABEL[option]}
          </option>
        ))}
      </select>
      <p className="mt-1 max-w-[16rem] text-[11px] leading-4 text-mute">
        {pending ? "Saving…" : ACCESS_ROLE_HINT[role]}
      </p>
      {error ? <p className="text-[11px] leading-4 text-crust">{error}</p> : null}
    </div>
  );
}

export function RemoveTeamMemberButton({
  teamId,
  personId,
  name,
}: {
  teamId: string;
  personId: string;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-1 text-[12px] font-medium text-mute hover:text-crust"
      >
        Remove
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <p className="max-w-[16rem] text-[12px] leading-5 text-mute">
        Remove {name}? They lose this team&apos;s access unless another team still
        grants it.
      </p>
      {error ? <p className="text-[12px] leading-5 text-crust">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await removeTeamMemberAction(teamId, personId);
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Could not remove this person.",
                );
              }
            });
          }}
          className="text-[12px] font-semibold text-crust hover:text-crust-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Removing…" : "Confirm remove"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="text-[12px] font-medium text-mute hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DeleteTeamForm({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <SecondaryButton type="button" onClick={() => setConfirming(true)}>
        Delete team
      </SecondaryButton>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-mute">
        Delete {teamName}? Members will lose access to the portfolios and projects
        this team had, unless they still have that work through another team.
      </p>
      {error ? <p className="text-[12px] leading-5 text-crust">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await deleteTeamAction(teamId);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Could not delete this team.",
                );
              }
            });
          }}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-crust px-5 text-sm font-semibold text-white transition-colors hover:bg-crust-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete team"}
        </button>
        <SecondaryButton
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}
