import { notFound } from "next/navigation";
import { Board } from "@/components/app/Board";
import { getAccessibleProject } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();
  const people = bundle.members.map((member) => member.person).filter(Boolean);
  return <Board tasks={bundle.tasks} people={people} />;
}
