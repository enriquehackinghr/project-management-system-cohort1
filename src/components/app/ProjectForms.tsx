import { addMemberToProject } from "@/actions/projects";
import { createPhase, createTask } from "@/actions/tasks";
import type { Phase, Person } from "@/lib/types";
import { PersonPicker } from "./PersonPicker";
import { Field, inputClass, PrimaryButton, textareaClass } from "./ui";

export function MemberForm({ projectId }: { projectId: string }) {
  const action = addMemberToProject.bind(null, projectId);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <input className={inputClass} name="firstName" required placeholder="First name" />
      <input className={inputClass} name="lastName" required placeholder="Last name" />
      <input className={inputClass} name="email" type="email" required placeholder="Email" />
      <input className={inputClass} name="role" placeholder="Role" />
      <div className="flex gap-2 lg:col-span-2">
        <input className={inputClass} name="capacity" type="number" defaultValue={40} />
        <PrimaryButton type="submit" className="shrink-0 px-4">
          Add
        </PrimaryButton>
      </div>
    </form>
  );
}

export function PhaseForm({ projectId }: { projectId: string }) {
  const action = createPhase.bind(null, projectId);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <input className={inputClass} name="name" required placeholder="Phase name" />
      <input className={inputClass} name="startDate" type="date" />
      <input className={inputClass} name="endDate" type="date" />
      <PrimaryButton type="submit">Add phase</PrimaryButton>
    </form>
  );
}

export function TaskForm({
  projectId,
  phases,
  people,
}: {
  projectId: string;
  phases: Phase[];
  people: Person[];
}) {
  const action = createTask.bind(null, projectId);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Title">
        <input className={inputClass} name="title" required />
      </Field>
      <Field label="Phase">
        <select className={inputClass} name="phaseId" defaultValue="">
          <option value="">None</option>
          {phases.map((phase) => (
            <option key={phase.id} value={phase.id}>
              {phase.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Priority">
        <select className={inputClass} name="priority" defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </Field>
      <Field label="Estimate hours">
        <input className={inputClass} name="estimateHours" type="number" min="0" />
      </Field>
      <Field label="Due date">
        <input className={inputClass} name="dueDate" type="date" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description">
          <textarea className={textareaClass} name="description" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        {/* Not a Field: CheckboxGroup renders its own labels and they cannot nest. */}
        <p className="mb-1.5 text-[13px] font-medium text-mute">Assigned to</p>
        <PersonPicker
          people={people}
          name="assigneeIds"
          emptyLabel="Add members to this project before assigning work."
        />
      </div>
      <input type="hidden" name="startDate" />
      <PrimaryButton type="submit">Add task</PrimaryButton>
    </form>
  );
}
