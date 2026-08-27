import "server-only";

import { Resend } from "resend";
import { getAppUrl, getEmailFrom, getResendApiKey } from "./env";
import {
  membershipInviteHtml,
  membershipInviteSubject,
  membershipInviteText,
  roleChangedHtml,
  roleChangedSubject,
  roleChangedText,
} from "./email-templates";
import type { AccessRole } from "./types";

export type AddedToWorkEmail = {
  to: string;
  recipientFirstName: string;
  inviterName: string;
  workKind: "project" | "portfolio";
  workName: string;
  workId: string;
};

export type RoleChangedEmail = {
  to: string;
  recipientFirstName: string;
  actorName: string;
  teamName: string;
  previousRole: AccessRole;
  newRole: AccessRole;
};

function workPath(kind: "project" | "portfolio", id: string) {
  const workId = id.trim();
  if (!workId) {
    throw new Error("Cannot build a membership link without a project or portfolio id.");
  }
  return kind === "portfolio"
    ? `/app/portfolios/${workId}`
    : `/app/projects/${workId}`;
}

export function membershipLinks(kind: "project" | "portfolio", id: string) {
  const appUrl = getAppUrl();
  const path = workPath(kind, id);
  return {
    workUrl: `${appUrl}${path}`,
    loginUrl: `${appUrl}/login?next=${encodeURIComponent(path)}`,
  };
}

async function send(
  label: string,
  to: string,
  message: { subject: string; html: string; text: string },
) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn(`Skipping ${label} email: missing RESEND_API or RESEND_API_KEY.`);
    return { sent: false as const, error: "missing_api_key" };
  }

  const recipient = to.trim().toLowerCase();
  if (!recipient) {
    return { sent: false as const, error: "missing_recipient" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getEmailFrom(),
      to: recipient,
      ...message,
    });
    if (error) {
      console.error(`${label} email failed`, error);
      return { sent: false as const, error: error.message };
    }
    return { sent: true as const };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown email error";
    console.error(`${label} email failed`, detail);
    return { sent: false as const, error: detail };
  }
}

export async function sendAddedToWorkEmail(input: AddedToWorkEmail) {
  const content = {
    recipientFirstName: input.recipientFirstName,
    inviterName: input.inviterName,
    workKind: input.workKind,
    workName: input.workName,
    ...membershipLinks(input.workKind, input.workId),
  };

  return send("Membership", input.to, {
    subject: membershipInviteSubject(content),
    html: membershipInviteHtml(content),
    text: membershipInviteText(content),
  });
}

export async function sendRoleChangedEmail(input: RoleChangedEmail) {
  const appUrl = getAppUrl();
  const content = {
    recipientFirstName: input.recipientFirstName,
    actorName: input.actorName,
    teamName: input.teamName,
    previousRole: input.previousRole,
    newRole: input.newRole,
    appUrl: `${appUrl}/app/projects`,
    loginUrl: `${appUrl}/login?next=${encodeURIComponent("/app/projects")}`,
  };

  return send("Role change", input.to, {
    subject: roleChangedSubject(content),
    html: roleChangedHtml(content),
    text: roleChangedText(content),
  });
}
