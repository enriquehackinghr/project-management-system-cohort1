import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./constants";
import { getSessionSecret } from "./env";
import { joinName, splitName } from "./names";
import type { SessionPerson } from "./types";

export { SESSION_COOKIE };
export type { SessionPerson };

function secretKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export async function signSession(person: SessionPerson) {
  return new SignJWT(person)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function readSessionToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  if (typeof payload.personId !== "string" || typeof payload.email !== "string") {
    return null;
  }
  const fullName =
    typeof payload.fullName === "string"
      ? payload.fullName
      : joinName(
          typeof payload.firstName === "string" ? payload.firstName : "",
          typeof payload.lastName === "string" ? payload.lastName : "",
        );
  if (!fullName) return null;
  const split = splitName(fullName);
  const firstName =
    typeof payload.firstName === "string" && payload.firstName.trim()
      ? payload.firstName.trim()
      : split.firstName;
  const lastName =
    typeof payload.lastName === "string"
      ? payload.lastName.trim()
      : split.lastName;
  return {
    personId: payload.personId,
    email: payload.email,
    firstName,
    lastName,
    fullName: joinName(firstName, lastName) || fullName,
  } satisfies SessionPerson;
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await readSessionToken(token);
  } catch {
    return null;
  }
}

export function safeNextPath(value: unknown) {
  if (typeof value !== "string") return "/app/projects";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/app/projects";
  }
  return value;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const headerStore = await headers();
    const path = headerStore.get("x-baguette-path");
    const next =
      path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
        ? `?next=${encodeURIComponent(path)}`
        : "";
    redirect(`/login${next}`);
  }
  return session;
}

export async function setSessionCookie(person: SessionPerson) {
  const token = await signSession(person);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
