import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/app/AuthScreen";
import { LoginForm } from "@/components/app/LoginForm";
import { getSession, safeNextPath } from "@/lib/session";

export default async function LoginPage({
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
      kicker="Welcome back"
      title="Log in to Baguette"
      description="Use the email and password you signed up with to open your projects."
    >
      <LoginForm next={next} />
    </AuthScreen>
  );
}
