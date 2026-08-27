"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logIn } from "@/actions/session";
import { Field, inputClass, PrimaryButton } from "./ui";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState(logIn, undefined);
  const nextPath = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form
      key={state?.values?.email ?? "new"}
      action={action}
      className="space-y-4"
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {notice && !state?.message ? (
        <p className="rounded-xl bg-[#e8f8f0] px-3 py-2 text-[13px] leading-5 text-[#00854d]">
          {notice}
        </p>
      ) : null}
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
      <Field label="Password" error={state?.errors?.password?.[0]}>
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state?.errors?.password)}
        />
      </Field>
      <p className="text-right text-[13px] leading-5">
        <Link
          href="/forgot-password"
          className="font-medium text-mute hover:text-crust"
        >
          Forgot your password?
        </Link>
      </p>
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log in"}
      </PrimaryButton>
      <p className="text-center text-[13px] leading-5 text-mute">
        New to Baguette?{" "}
        <Link href={`/signup${nextPath}`} className="font-medium text-crust hover:text-crust-deep">
          Create an account
        </Link>
      </p>
    </form>
  );
}
