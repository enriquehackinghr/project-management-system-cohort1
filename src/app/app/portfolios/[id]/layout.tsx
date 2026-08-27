import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PortfolioNav } from "@/components/app/AppShell";
import { PortfolioAssistant } from "@/components/app/Assistant";
import { AuditTracker } from "@/components/app/AuditTracker";
import { getAccessiblePortfolio, getPortfolioAccessRole } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function PortfolioLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bundle = await getAccessiblePortfolio(id, session.personId);
  if (!bundle) notFound();
  const canEdit = (await getPortfolioAccessRole(id, session.personId)) === "admin";

  return (
    <AuditTracker scope="portfolio" portfolioId={id}>
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <PortfolioNav
          portfolioId={id}
          name={bundle.portfolio.name}
          canEdit={canEdit}
        />
        <main className="min-w-0 flex-1 overflow-auto px-5 py-7 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
      <PortfolioAssistant
        portfolioId={id}
        portfolioName={bundle.portfolio.name}
        canEdit={canEdit}
      />
    </AuditTracker>
  );
}
