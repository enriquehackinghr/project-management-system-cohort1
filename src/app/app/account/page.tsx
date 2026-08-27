import { notFound } from "next/navigation";
import { AccountForm } from "@/components/app/AccountForm";
import { Card, PageHeader } from "@/components/app/ui";
import { getPersonById } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function AccountPage() {
  const session = await requireSession();
  const person = await getPersonById(session.personId);
  if (!person) notFound();

  return (
    <div>
      <PageHeader
        kicker="Account"
        title="Your account"
        description="Update your name, email, and the details used on this account."
      />
      <Card className="max-w-xl">
        <AccountForm person={person} />
      </Card>
    </div>
  );
}
