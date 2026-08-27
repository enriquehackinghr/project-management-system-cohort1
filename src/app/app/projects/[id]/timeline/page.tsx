import { notFound } from "next/navigation";
import { Timeline } from "@/components/app/Timeline";
import { getAccessibleProject, getProjectAccessRole } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();
  const people = bundle.members.map((member) => member.person).filter(Boolean);
  const canEdit = (await getProjectAccessRole(id, session.personId)) === "admin";
  return (
    <Timeline
      phases={bundle.phases}
      tasks={bundle.tasks}
      dependencies={bundle.dependencies}
      people={people}
      assignees={bundle.assignees}
      membersByProject={{ [id]: people }}
      canEdit={canEdit}
    />
  );
}
