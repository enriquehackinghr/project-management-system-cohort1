"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
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
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        minLength={8}
        error={state?.errors?.password?.[0]}
        hint="At least 8 characters, with a letter and a number."
      />
      <PasswordField
        label="Confirm password"
        name="passwordConfirm"
        autoComplete="new-password"
        error={state?.errors?.passwordConfirm?.[0]}
      />
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

function PasswordField({
  label,
  name,
  autoComplete,
  minLength,
  error,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: string;
  minLength?: number;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="block">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-mute">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={`${inputClass} pr-11`}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-mute transition-colors hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <span className="mt-1.5 block text-[12px] leading-5 text-crust">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] leading-5 text-mute">{hint}</span>
      ) : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.4A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a16.4 16.4 0 0 1-3.3 4.3M6.6 6.8C4.2 8.5 2.5 12 2.5 12S6 19 12 19c1.5 0 2.9-.4 4.1-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
