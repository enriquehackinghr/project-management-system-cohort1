import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/app/AuthScreen";
import { SignupForm } from "@/components/app/SignupForm";
import { getSession, safeNextPath } from "@/lib/session";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) {
    redirect(safeNextPath(next));
  }

  return (
    <AuthScreen
      wide
      kicker="Create an account"
      title="Sign up for Baguette"
      description="Your projects stay attached to this person. Use the same email and password to pick up the work later."
    >
      <SignupForm next={next} />
    </AuthScreen>
  );
}
