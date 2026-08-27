import { writeAuditEvent } from "@/lib/audit-store";
import { assertPortfolioAccess, assertProjectAccess } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { AuditKind } from "@/lib/types";

const KINDS = new Set<AuditKind>(["view", "click"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let body: {
    kind?: string;
    action?: string;
    summary?: string;
    projectId?: string;
    portfolioId?: string;
    href?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const kind = body.kind;
  const summary = String(body.summary ?? "").trim();
  if (!kind || !KINDS.has(kind as AuditKind) || !summary) {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    if (body.projectId) {
      await assertProjectAccess(body.projectId, session.personId);
    } else if (body.portfolioId) {
      await assertPortfolioAccess(body.portfolioId, session.personId);
    } else {
      return Response.json({ ok: false }, { status: 400 });
    }
  } catch {
    return Response.json({ ok: false }, { status: 403 });
  }

  await writeAuditEvent({
    actorId: session.personId,
    kind: kind as AuditKind,
    action: String(body.action ?? "ui.event"),
    summary,
    projectId: body.projectId,
    portfolioId: body.portfolioId,
    metadata: body.href ? { href: body.href } : {},
  });

  return Response.json({ ok: true });
}
