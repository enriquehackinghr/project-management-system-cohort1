"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { moveTask } from "@/actions/tasks";
import { formatDate } from "@/lib/dates";
import {
  PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
  type Person,
  type Task,
  type TaskAssignee,
  type TaskStatus,
} from "@/lib/types";
import { TaskAssignees } from "./TaskAssignees";
import { Pill } from "./ui";

export function Board({
  tasks,
  people,
  assignees,
  membersByProject,
  projectColors,
  projectNames,
  canEdit = true,
}: {
  tasks: Task[];
  people: Person[];
  assignees: TaskAssignee[];
  /** Portfolio and account boards mix projects, and each has its own member pool. */
  membersByProject?: Record<string, Person[]>;
  projectColors?: Record<string, string>;
  projectNames?: Record<string, string>;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const assigneesByTask = new Map<string, Person[]>();
  for (const row of assignees) {
    const person = peopleById.get(row.person_id);
    if (!person) continue;
    assigneesByTask.set(row.task_id, [
      ...(assigneesByTask.get(row.task_id) ?? []),
      person,
    ]);
  }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
    const overId = event.over?.id;
    if (!overId) return;
    const status = String(overId) as TaskStatus;
    if (!TASK_STATUSES.includes(status)) return;
    const taskId = String(event.active.id);
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    startTransition(async () => {
      await moveTask(task.project_id, taskId, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {canEdit ? null : (
        <p className="text-sm leading-6 text-mute">
          View only — ask a team owner for the admin role to move cards.
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
              assigneesByTask={assigneesByTask}
              membersFor={(projectId) => membersByProject?.[projectId] ?? people}
              projectColors={projectColors}
              projectNames={projectNames}
              canEdit={canEdit}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  tasks,
  assigneesByTask,
  membersFor,
  projectColors,
  projectNames,
  canEdit,
}: {
  status: TaskStatus;
  tasks: Task[];
  assigneesByTask: Map<string, Person[]>;
  membersFor: (projectId: string) => Person[];
  projectColors?: Record<string, string>;
  projectNames?: Record<string, string>;
  canEdit: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const tints: Record<TaskStatus, string> = {
    todo: "bg-[#e3f0ff]",
    in_progress: "bg-[#fff4d5]",
    blocked: "bg-[#ffe8df]",
    done: "bg-[#e8f8f0]",
  };

  return (
    <div
      ref={setNodeRef}
      className={`min-h-72 rounded-2xl border border-flour/80 p-3 ${tints[status]} ${isOver ? "ring-2 ring-crust/40" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[13px] font-semibold">{TASK_STATUS_LABEL[status]}</p>
        <span className="text-[12px] text-mute">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card
            key={task.id}
            task={task}
            assignees={assigneesByTask.get(task.id) ?? []}
            members={membersFor(task.project_id)}
            color={projectColors?.[task.project_id]}
            projectName={projectNames?.[task.project_id]}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}

function Card({
  task,
  assignees,
  members,
  color,
  projectName,
  canEdit,
}: {
  task: Task;
  assignees: Person[];
  members: Person[];
  color?: string;
  projectName?: string;
  canEdit: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canEdit,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        borderLeftColor: color,
        borderLeftWidth: color ? 4 : undefined,
      }}
      className={`rounded-xl border border-flour/70 bg-white p-3 shadow-sm ${canEdit ? "cursor-grab" : "cursor-default"} ${isDragging ? "opacity-70" : ""}`}
    >
      {projectName ? (
        <p className="mb-1 truncate text-[11px] font-medium" style={{ color }}>
          {projectName}
        </p>
      ) : null}
      <p className="text-[13px] font-medium leading-5">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-mute">
        <TaskAssignees
          projectId={task.project_id}
          taskId={task.id}
          assignees={assignees}
          candidates={members}
          canEdit={canEdit}
        />
        <span>{formatDate(task.due_date)}</span>
        <Pill tone={task.priority === "high" ? "crust" : task.priority === "medium" ? "wheat" : "mute"}>
          {PRIORITY_LABEL[task.priority]}
        </Pill>
      </div>
    </div>
  );
}
