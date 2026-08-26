"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/actions/session";
import { COUNTRIES } from "@/lib/countries";
import { INDUSTRIES } from "@/lib/industries";
import { Field, inputClass, PrimaryButton, selectClass } from "./ui";

export function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const nextPath = next ? `?next=${encodeURIComponent(next)}` : "";
  const values = state?.values;

  return (
    <form
      key={values ? `${values.email}-${values.emailConfirm}-${values.industry}-${values.country}` : "new"}
      action={action}
      className="space-y-4"
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.message ? (
        <p className="rounded-xl bg-[#ffe8df] px-3 py-2 text-[13px] leading-5 text-crust">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={state?.errors?.firstName?.[0]}>
          <input
            className={inputClass}
            name="firstName"
            required
            autoComplete="given-name"
            placeholder="Ada"
            defaultValue={values?.firstName}
            aria-invalid={Boolean(state?.errors?.firstName)}
          />
        </Field>
        <Field label="Last name" error={state?.errors?.lastName?.[0]}>
          <input
            className={inputClass}
            name="lastName"
            required
            autoComplete="family-name"
            placeholder="Khan"
            defaultValue={values?.lastName}
            aria-invalid={Boolean(state?.errors?.lastName)}
          />
        </Field>
      </div>
      <Field label="Email" error={state?.errors?.email?.[0]}>
        <input
          className={inputClass}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ada@company.com"
          defaultValue={values?.email}
          aria-invalid={Boolean(state?.errors?.email)}
        />
      </Field>
      <Field label="Confirm email" error={state?.errors?.emailConfirm?.[0]}>
        <input
          className={inputClass}
          name="emailConfirm"
          type="email"
          required
          autoComplete="email"
          placeholder="ada@company.com"
          defaultValue={values?.emailConfirm}
          aria-invalid={Boolean(state?.errors?.emailConfirm)}
        />
      </Field>
      <Field
        label="Password"
        error={state?.errors?.password?.[0]}
        hint="At least 8 characters, with a letter and a number."
      >
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-invalid={Boolean(state?.errors?.password)}
        />
      </Field>
      <Field label="Industry" error={state?.errors?.industry?.[0]}>
        <select
          className={selectClass}
          name="industry"
          required
          defaultValue={values?.industry ?? ""}
          aria-invalid={Boolean(state?.errors?.industry)}
        >
          <option value="" disabled>
            Select industry
          </option>
          {INDUSTRIES.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Country" error={state?.errors?.country?.[0]}>
        <select
          className={selectClass}
          name="country"
          required
          defaultValue={values?.country ?? ""}
          autoComplete="country-name"
          aria-invalid={Boolean(state?.errors?.country)}
        >
          <option value="" disabled>
            Select country
          </option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </Field>
      <PrimaryButton type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </PrimaryButton>
      <p className="text-center text-[13px] leading-5 text-mute">
        Already have an account?{" "}
        <Link href={`/login${nextPath}`} className="font-medium text-crust hover:text-crust-deep">
          Log in
        </Link>
      </p>
    </form>
  );
}
