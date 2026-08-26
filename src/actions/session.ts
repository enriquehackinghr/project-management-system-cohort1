"use server";

import { redirect } from "next/navigation";
import {
  createAccount,
  getAccountByPersonId,
  getPasswordHashForPerson,
  getPersonByEmail,
  recordLastLogin,
  updatePersonProfile,
  upsertPerson,
} from "@/lib/db";
import { joinName } from "@/lib/names";
import { dummyPasswordHash, hashPassword, verifyPassword } from "@/lib/password";
import {
  loginSchema,
  signupSchema,
  type LoginFormState,
  type SignupFormState,
} from "@/lib/schemas";
import { clearSessionCookie, safeNextPath, setSessionCookie } from "@/lib/session";
import type { Person } from "@/lib/types";

async function establishSession(person: Person, nextPath: unknown) {
  await setSessionCookie({
    personId: person.id,
    email: person.email,
    firstName: person.first_name,
    lastName: person.last_name,
    fullName: person.full_name || joinName(person.first_name, person.last_name),
  });
  redirect(safeNextPath(nextPath));
}

export async function signUp(
  _state: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    emailConfirm: String(formData.get("emailConfirm") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    country: String(formData.get("country") ?? ""),
  };
  const parsed = signupSchema.safeParse({
    ...values,
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values };
  }

  const { firstName, lastName, email, password, industry, country, next } =
    parsed.data;

  try {
    const existing = await getPersonByEmail(email);
    if (existing) {
      const account = await getAccountByPersonId(existing.id);
      if (account) {
        return {
          message: "An account with this email already exists. Log in instead.",
          values,
        };
      }
    }

    const person = existing ?? (await upsertPerson({ firstName, lastName, email }));
    const profiled = await updatePersonProfile(person.id, {
      firstName,
      lastName,
      industry,
      country,
    });
    await createAccount(profiled.id, await hashPassword(password));
    await establishSession(profiled, next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create your account.";
    if (message.includes("already exists")) {
      return {
        message: "An account with this email already exists. Log in instead.",
        values,
      };
    }
    return { message: "Could not create your account. Try again.", values };
  }
}

export async function logIn(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse({
    email: values.email,
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values };
  }

  const { email, password, next } = parsed.data;

  try {
    const person = await getPersonByEmail(email);
    const storedHash = person
      ? await getPasswordHashForPerson(person.id)
      : null;
    const hash = storedHash ?? (await dummyPasswordHash());
    const valid = await verifyPassword(password, hash);
    if (!person || !storedHash || !valid) {
      return { message: "Invalid email or password.", values };
    }
    await recordLastLogin(person.id);
    await establishSession(person, next);
  } catch {
    return { message: "Could not log in. Try again.", values };
  }
}

export async function logOut() {
  await clearSessionCookie();
  redirect("/");
}
