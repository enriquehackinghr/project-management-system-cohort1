import { notFound } from "next/navigation";
import { Timeline } from "@/components/app/Timeline";
import { getAccessibleProject } from "@/lib/db";
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
  return (
    <Timeline
      phases={bundle.phases}
      tasks={bundle.tasks}
      dependencies={bundle.dependencies}
    />
  );
}
