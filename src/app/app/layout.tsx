import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  return <AppShell person={session}>{children}</AppShell>;
}
