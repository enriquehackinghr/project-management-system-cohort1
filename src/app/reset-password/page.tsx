import Link from "next/link";
import { AuthScreen } from "@/components/app/AuthScreen";
import { ResetPasswordForm } from "@/components/app/ResetPasswordForm";
import { isResetTokenUsable } from "@/lib/password-reset";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const usable = token ? await isResetTokenUsable(token) : false;

  if (!usable) {
    return (
      <AuthScreen
        kicker="Reset link"
        title="This link no longer works"
        description="Reset links are good for one use and expire an hour after they are sent."
      >
        <div className="space-y-4">
          <p className="text-[13px] leading-5 text-mute">
            Ask for a fresh link and we&apos;ll email you a new one right away.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-crust px-5 text-sm font-semibold text-white transition-colors hover:bg-crust-deep"
          >
            Send a new link
          </Link>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      kicker="Almost there"
      title="Pick a new password"
      description="Choose something you have not used here before. You'll log in with it next."
    >
      <ResetPasswordForm token={token} />
    </AuthScreen>
  );
}
