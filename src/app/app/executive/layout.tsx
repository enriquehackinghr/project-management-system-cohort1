import type { ReactNode } from "react";
import { ExecutiveNav } from "@/components/app/AppShell";
import { requireSession } from "@/lib/session";

export default async function ExecutiveLayout({ children }: { children: ReactNode }) {
  await requireSession();

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <ExecutiveNav />
      <main className="min-w-0 flex-1 overflow-auto px-5 py-7 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
