"use server";

import { redirect } from "next/navigation";
import { upsertPerson } from "@/lib/db";
import { joinName } from "@/lib/names";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export async function startSession(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!firstName || !lastName || !email || !email.includes("@")) {
    throw new Error("First name, last name, and a valid email are required.");
  }

  const person = await upsertPerson({ firstName, lastName, email });
  await setSessionCookie({
    personId: person.id,
    email: person.email,
    firstName: person.first_name,
    lastName: person.last_name,
    fullName: person.full_name || joinName(person.first_name, person.last_name),
  });
  redirect("/app/projects");
}

export async function switchPerson() {
  await clearSessionCookie();
  redirect("/start");
}
