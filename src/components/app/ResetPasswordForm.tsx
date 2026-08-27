"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/actions/password";
import { Field, inputClass, PrimaryButton } from "./ui";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (state?.expired) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-[#ffe8df] px-3 py-2 text-[13px] leading-5 text-crust">
          {state.message}
        </p>
        <Link
          href="/forgot-password"
          className="block text-center text-[13px] font-medium leading-5 text-crust hover:text-crust-deep"
        >
          Ask for a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.message ? (
        <p className="rounded-xl bg-[#ffe8df] px-3 py-2 text-[13px] leading-5 text-crust">
          {state.message}
        </p>
      ) : null}
      <Field
        label="New password"
        error={state?.errors?.password?.[0]}
        hint="At least 8 characters with a letter and a number."
      >
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={Boolean(state?.errors?.password)}
        />
      </Field>
      <Field label="Confirm new password" error={state?.errors?.passwordConfirm?.[0]}>
        <input
          className={inputClass}
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={Boolean(state?.errors?.passwordConfirm)}
        />
      </Field>
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving your password…" : "Save new password"}
      </PrimaryButton>
    </form>
  );
}
