import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ProjectNav } from "@/components/app/AppShell";
import { ProjectAssistant } from "@/components/app/Assistant";
import { getAccessibleProject } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bundle = await getAccessibleProject(id, session.personId);
  if (!bundle) notFound();

  return (
    <>
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <ProjectNav
          projectId={id}
          name={bundle.project.name}
          canEdit={
            bundle.project.owner_id === session.personId ||
            bundle.project.created_by_id === session.personId
          }
        />
        <main className="min-w-0 flex-1 overflow-auto px-5 py-7 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
      <ProjectAssistant projectId={id} projectName={bundle.project.name} />
    </>
  );
}
