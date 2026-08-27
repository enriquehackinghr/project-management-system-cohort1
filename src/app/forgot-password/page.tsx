import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/app/AuthScreen";
import { ForgotPasswordForm } from "@/components/app/ForgotPasswordForm";
import { getSession, safeNextPath } from "@/lib/session";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) {
    redirect(safeNextPath(undefined));
  }

  return (
    <AuthScreen
      kicker="Locked out"
      title="Reset your password"
      description="Tell us the email you signed up with and we'll send a link to set a new password."
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
