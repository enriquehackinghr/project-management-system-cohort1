import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ProjectNav } from "@/components/app/AppShell";
import { ProjectAssistant } from "@/components/app/Assistant";
import { AuditTracker } from "@/components/app/AuditTracker";
import { getAccessibleProject, getProjectAccessRole } from "@/lib/db";
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
  const canEdit = (await getProjectAccessRole(id, session.personId)) === "admin";

  return (
    <AuditTracker scope="project" projectId={id}>
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <ProjectNav projectId={id} name={bundle.project.name} canEdit={canEdit} />
        <main className="min-w-0 flex-1 overflow-auto px-5 py-7 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
      <ProjectAssistant
        projectId={id}
        projectName={bundle.project.name}
        canEdit={canEdit}
      />
    </AuditTracker>
  );
}
