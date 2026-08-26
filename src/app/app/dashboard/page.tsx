import Link from "next/link";
import { CreatePortfolioForm } from "@/components/app/PortfolioForms";
import { Card, EmptyState, PageHeader, Pill } from "@/components/app/ui";
import { listPortfolioItems, listPortfoliosForPerson } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function PortfoliosPage() {
  const session = await requireSession();
  const portfolios = await listPortfoliosForPerson(session.personId);
  const items = await listPortfolioItems(portfolios.map((portfolio) => portfolio.id));

  return (
    <div>
      <PageHeader
        kicker="Portfolio"
        title="Your portfolios"
        description="Group projects together, or open a portfolio you were added to. Status changes write back to each project."
      />
      <Card className="mb-8">
        <p className="mb-3 text-sm font-medium">New portfolio</p>
        <CreatePortfolioForm />
      </Card>
      {portfolios.length === 0 ? (
        <EmptyState
          title="No portfolios yet"
          body="Name a portfolio, then add the projects that belong together."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {portfolios.map((portfolio) => {
            const members = items.filter((item) => item.portfolio_id === portfolio.id);
            return (
              <Link
                key={portfolio.id}
                href={`/app/portfolios/${portfolio.id}`}
                className="rounded-2xl border border-flour bg-white p-5 transition hover:border-crust/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{portfolio.name}</h2>
                  <Pill>{members.length} projects</Pill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {members.length === 0 ? (
                    <p className="text-sm text-mute">No projects added yet.</p>
                  ) : (
                    members.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-foam px-2.5 py-1 text-[12px]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.project.name}
                      </span>
                    ))
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
