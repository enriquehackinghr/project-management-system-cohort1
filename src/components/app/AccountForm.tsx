"use client";

import { useActionState } from "react";
import { updateAccount } from "@/actions/session";
import { COUNTRIES, isCountry } from "@/lib/countries";
import { INDUSTRIES, isIndustry } from "@/lib/industries";
import type { Person } from "@/lib/types";
import { Field, inputClass, PrimaryButton, selectClass } from "./ui";

export function AccountForm({ person }: { person: Person }) {
  const [state, action, pending] = useActionState(updateAccount, undefined);
  const values = state?.values;

  return (
    <form
      key={state?.saved ? `saved-${values?.email}-${values?.firstName}` : "edit"}
      action={action}
      className="space-y-4"
    >
      {state?.message ? (
        <p
          className={`rounded-xl px-3 py-2 text-[13px] leading-5 ${
            state.saved
              ? "bg-[#e8f8f0] text-[#00854d]"
              : "bg-[#ffe8df] text-crust"
          }`}
        >
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
            defaultValue={values?.firstName ?? person.first_name}
            aria-invalid={Boolean(state?.errors?.firstName)}
          />
        </Field>
        <Field label="Last name" error={state?.errors?.lastName?.[0]}>
          <input
            className={inputClass}
            name="lastName"
            required
            autoComplete="family-name"
            defaultValue={values?.lastName ?? person.last_name}
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
          defaultValue={values?.email ?? person.email}
          aria-invalid={Boolean(state?.errors?.email)}
        />
      </Field>
      <Field label="Industry" error={state?.errors?.industry?.[0]}>
        <select
          className={selectClass}
          name="industry"
          required
          defaultValue={values?.industry ?? person.industry ?? ""}
          aria-invalid={Boolean(state?.errors?.industry)}
        >
          <option value="" disabled>
            Select industry
          </option>
          {person.industry && !isIndustry(person.industry) ? (
            <option value={person.industry}>{person.industry}</option>
          ) : null}
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
          defaultValue={values?.country ?? person.country ?? ""}
          autoComplete="country-name"
          aria-invalid={Boolean(state?.errors?.country)}
        >
          <option value="" disabled>
            Select country
          </option>
          {person.country && !isCountry(person.country) ? (
            <option value={person.country}>{person.country}</option>
          ) : null}
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </Field>
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </PrimaryButton>
    </form>
  );
}
