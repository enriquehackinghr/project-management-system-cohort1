"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/actions/password";
import { Field, inputClass, PrimaryButton } from "./ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-[#e8f8f0] px-3 py-2 text-[13px] leading-5 text-[#00854d]">
          If that email has a Baguette account, a reset link is on its way. The
          link works once and expires in an hour.
        </p>
        <p className="text-[13px] leading-5 text-mute">
          Check your spam folder if it does not land in a minute or two.
        </p>
        <Link
          href="/login"
          className="block text-center text-[13px] font-medium leading-5 text-crust hover:text-crust-deep"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.message ? (
        <p className="rounded-xl bg-[#ffe8df] px-3 py-2 text-[13px] leading-5 text-crust">
          {state.message}
        </p>
      ) : null}
      <Field label="Email" error={state?.errors?.email?.[0]}>
        <input
          className={inputClass}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ada@company.com"
          defaultValue={state?.values?.email}
          aria-invalid={Boolean(state?.errors?.email)}
        />
      </Field>
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Sending the link…" : "Send the reset link"}
      </PrimaryButton>
      <p className="text-center text-[13px] leading-5 text-mute">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-crust hover:text-crust-deep">
          Log in
        </Link>
      </p>
    </form>
  );
}
