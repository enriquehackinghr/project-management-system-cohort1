import { addDays, clamp, daysBetween, formatDate, todayIso } from "@/lib/dates";
import {
  TASK_STATUS_LABEL,
  type Phase,
  type Task,
  type TaskDependency,
  type TaskStatus,
} from "@/lib/types";

const BAR: Record<TaskStatus, string> = {
  todo: "bg-[#c5cad6]",
  in_progress: "bg-crust",
  blocked: "bg-[#c47d00]",
  done: "bg-olive",
};

export function Timeline({
  phases,
  tasks,
  dependencies,
  projects,
}: {
  phases: Phase[];
  tasks: Task[];
  dependencies: TaskDependency[];
  projects?: Array<{ id: string; name: string; color?: string }>;
}) {
  const dated = tasks.filter((task) => task.start_date || task.due_date);
  const starts = [
    ...dated.map((task) => task.start_date ?? task.due_date),
    ...phases.map((phase) => phase.start_date),
  ].filter((value): value is string => Boolean(value));
  const ends = [
    ...dated.map((task) => task.due_date ?? task.start_date),
    ...phases.map((phase) => phase.end_date),
  ].filter((value): value is string => Boolean(value));
  const min = starts.sort()[0];
  const max = ends.sort().at(-1);

  if (!min || !max) {
    return (
      <div className="rounded-2xl border border-dashed border-flour bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold tracking-tight">No dates to plot</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mute">
          Add start and due dates on phases or tasks and the timeline will draw a
          Gantt chart with dependencies.
        </p>
      </div>
    );
  }

  const span = Math.max(daysBetween(min, max), 1);
  const pxPerDay = span > 240 ? 7 : span > 120 ? 10 : span > 60 ? 14 : 18;
  const chartWidth = Math.max(720, span * pxPerDay);
  const today = todayIso();
  const todayLeft =
    today >= min && today <= max ? (daysBetween(min, today) / span) * chartWidth : null;

  const groups = projects?.length
    ? projects.flatMap((project) => {
        const projectTasks = tasks.filter((task) => task.project_id === project.id);
        const projectPhases = phases.filter((phase) => phase.project_id === project.id);
        return [
          {
            id: `project-${project.id}`,
            name: project.name,
            color: project.color,
            start: null as string | null,
            end: null as string | null,
            tasks: [] as Task[],
            header: true,
          },
          ...projectPhases.map((phase) => ({
            id: phase.id,
            name: phase.name,
            color: project.color,
            start: phase.start_date,
            end: phase.end_date,
            tasks: projectTasks.filter((task) => task.phase_id === phase.id),
            header: false,
          })),
          {
            id: `none-${project.id}`,
            name: "Ungrouped",
            color: project.color,
            start: null,
            end: null,
            tasks: projectTasks.filter((task) => !task.phase_id),
            header: false,
          },
        ].filter((group) => group.header || group.tasks.length > 0);
      })
    : [
        ...phases.map((phase) => ({
          id: phase.id,
          name: phase.name,
          color: undefined as string | undefined,
          start: phase.start_date,
          end: phase.end_date,
          tasks: tasks.filter((task) => task.phase_id === phase.id),
          header: false,
        })),
        {
          id: "none",
          name: "Ungrouped",
          color: undefined as string | undefined,
          start: null as string | null,
          end: null as string | null,
          tasks: tasks.filter((task) => !task.phase_id),
          header: false,
        },
      ].filter((group) => group.tasks.length > 0 || group.id !== "none");

  const taskRows: { task: Task; top: number }[] = [];
  let cursor = 0;
  for (const group of groups) {
    cursor += 34;
    for (const task of group.tasks) {
      taskRows.push({ task, top: cursor + 20 });
      cursor += 40;
    }
  }

  const positions = new Map<string, { left: number; width: number; center: number; top: number }>();
  for (const { task, top } of taskRows) {
    const start = task.start_date ?? task.due_date ?? min;
    const end = task.due_date ?? task.start_date ?? max;
    const left = clamp((daysBetween(min, start) / span) * chartWidth, 0, chartWidth);
    const width = clamp(
      (Math.max(daysBetween(start, end), 1) / span) * chartWidth,
      10,
      chartWidth - left,
    );
    positions.set(task.id, { left, width, center: left + width / 2, top });
  }

  const marks = timeMarks(min, max, span);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-crust">Schedule</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Timeline</h2>
          <p className="mt-1 text-sm text-mute">
            {formatDate(min)} — {formatDate(max)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] text-mute">
          {projects?.length
            ? projects.map((project) => (
                <span key={project.id} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: project.color ?? "#c5cad6" }}
                  />
                  {project.name}
                </span>
              ))
            : (
              <>
                <Legend color="bg-[#c5cad6]" label="Ready" />
                <Legend color="bg-crust" label="In progress" />
                <Legend color="bg-[#c47d00]" label="Blocked" />
                <Legend color="bg-olive" label="Done" />
              </>
            )}
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-flour bg-white">
        <div style={{ minWidth: 252 + chartWidth }}>
          <div
            className="sticky top-0 z-20 grid border-b border-flour bg-white"
            style={{ gridTemplateColumns: `252px ${chartWidth}px` }}
          >
            <div className="sticky left-0 z-30 border-r border-flour bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-mute">
              Work
            </div>
            <div className="relative h-12">
              {marks.map((mark) => (
                <div
                  key={mark.iso}
                  className="absolute top-0 h-full border-l border-flour/80 px-2 pt-2 text-[11px] text-mute"
                  style={{ left: (daysBetween(min, mark.iso) / span) * chartWidth }}
                >
                  {mark.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
          {groups.map((group) => {
            const phaseLeft =
              group.start != null
                ? clamp((daysBetween(min, group.start) / span) * chartWidth, 0, chartWidth)
                : 0;
            const phaseWidth =
              group.start && group.end
                ? clamp(
                    (Math.max(daysBetween(group.start, group.end), 1) / span) * chartWidth,
                    12,
                    chartWidth - phaseLeft,
                  )
                : 0;
            return (
              <section key={group.id}>
                <div
                  className="grid border-b border-flour bg-foam/70"
                  style={{ gridTemplateColumns: `252px ${chartWidth}px` }}
                >
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-flour bg-foam/70 px-4 py-2 text-[13px] font-semibold">
                    {group.color ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    ) : null}
                    <span className="truncate">{group.name}</span>
                  </div>
                  <div className="relative h-[34px]">
                    {phaseWidth > 0 ? (
                      <div
                        className="absolute top-1.5 h-5 rounded-full bg-crust/15"
                        style={{
                          left: phaseLeft,
                          width: phaseWidth,
                          backgroundColor: group.color ? `${group.color}33` : undefined,
                        }}
                      />
                    ) : null}
                    {todayLeft != null ? (
                      <div
                        className="absolute top-0 h-full w-px bg-crust"
                        style={{ left: todayLeft }}
                      />
                    ) : null}
                  </div>
                </div>
                {group.tasks.map((task) => {
                  const pos = positions.get(task.id);
                  return (
                    <div
                      key={task.id}
                      className="grid border-b border-flour/80"
                      style={{ gridTemplateColumns: `252px ${chartWidth}px` }}
                    >
                      <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-flour bg-white px-4 py-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${BAR[task.status]}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{task.title}</p>
                          <p className="truncate text-[11px] text-mute">
                            {TASK_STATUS_LABEL[task.status]}
                            {task.due_date ? ` · ${formatDate(task.due_date)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="relative h-10 bg-[linear-gradient(to_right,rgba(236,238,243,0.65)_1px,transparent_1px)] bg-[length:48px_100%]">
                        {todayLeft != null ? (
                          <div
                            className="absolute top-0 h-full w-px bg-crust/70"
                            style={{ left: todayLeft }}
                          />
                        ) : null}
                        {pos ? (
                          <div
                            className={`absolute top-2 h-6 rounded-full ${group.color ? "" : BAR[task.status]}`}
                            style={{
                              left: pos.left,
                              width: pos.width,
                              backgroundColor: group.color,
                            }}
                            title={`${task.title} ${formatDate(task.start_date)} – ${formatDate(task.due_date)}`}
                          />
                        ) : (
                          <p className="absolute left-3 top-2 text-[11px] text-mute">No dates</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}

            <svg
              className="pointer-events-none absolute top-0 left-[252px]"
              width={chartWidth}
              height={cursor}
            >
              {dependencies.map((dep) => {
                const from = positions.get(dep.predecessor_id);
                const to = positions.get(dep.successor_id);
                if (!from || !to) return null;
                const x1 = from.left + from.width;
                const y1 = from.top;
                const x2 = to.left;
                const y2 = to.top;
                const mid = x1 + Math.max(16, (x2 - x1) / 2);
                return (
                  <path
                    key={dep.id}
                    d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="#e04e1b"
                    strokeWidth="1.4"
                    markerEnd="url(#gantt-arrow)"
                    opacity="0.85"
                  />
                );
              })}
              <defs>
                <marker
                  id="gantt-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8" fill="#e04e1b" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function timeMarks(min: string, max: string, span: number) {
  const marks: { iso: string; label: string }[] = [];
  const step = span > 180 ? 30 : span > 70 ? 14 : 7;
  for (let offset = 0; offset <= span; offset += step) {
    const iso = addDays(min, offset);
    if (iso > max) break;
    marks.push({
      iso,
      label: formatDate(iso).slice(0, 5),
    });
  }
  return marks;
}
