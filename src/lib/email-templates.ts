import type { AccessRole } from "./types";

export type MembershipInviteContent = {
  recipientFirstName: string;
  inviterName: string;
  workKind: "project" | "portfolio";
  workName: string;
  workUrl: string;
  loginUrl: string;
};

export type RoleChangedContent = {
  recipientFirstName: string;
  actorName: string;
  teamName: string;
  previousRole: AccessRole;
  newRole: AccessRole;
  appUrl: string;
  loginUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function membershipInviteSubject(input: Pick<MembershipInviteContent, "workKind" | "workName">) {
  return `You've been added to ${input.workName} on Baguette`;
}

export function membershipInviteText(input: MembershipInviteContent) {
  const kind = input.workKind;
  const first = input.recipientFirstName.trim() || "there";
  return [
    `Hi ${first},`,
    "",
    `${input.inviterName} added you to the ${kind} "${input.workName}" on Baguette.`,
    "",
    `Open it here: ${input.workUrl}`,
    "",
    "Baguette — The project operating system",
  ].join("\n");
}

export function membershipInviteHtml(input: MembershipInviteContent) {
  const first = escapeHtml(input.recipientFirstName.trim() || "there");
  const inviter = escapeHtml(input.inviterName);
  const workName = escapeHtml(input.workName);
  const kind = input.workKind;
  const kindLabel = kind === "portfolio" ? "portfolio" : "project";
  const workUrl = escapeHtml(input.workUrl);
  const preheader = `${input.inviterName} added you to the ${kindLabel} ${input.workName}.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(membershipInviteSubject(input))}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;color:#1f2128;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:32px 16px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="background:#111318;border-radius:28px 28px 0 0;padding:28px 32px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" height="32" align="center" valign="middle" style="background:#e04e1b;border-radius:10px;width:32px;height:32px;">
                      <span style="display:block;color:#fff4d5;font-family:Georgia,'Source Serif 4',serif;font-size:16px;line-height:32px;font-weight:700;">b</span>
                    </td>
                    <td style="padding-left:10px;color:#ffffff;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:18px;font-weight:600;letter-spacing:-0.02em;">
                      Baguette
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#ffb45a;">
                  Project operating system
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:36px 32px 8px;">
                <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#e04e1b;">
                  A seat at the table
                </p>
                <h1 style="margin:10px 0 0;font-family:'Source Serif 4',Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:600;color:#1f2128;">
                  You've been added to ${workName}.
                </h1>
                <p style="margin:18px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#323338;">
                  Hi ${first} — ${inviter} just added you to this ${kindLabel} on Baguette. The board, timeline, and status all live in one place. Come take a look.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:22px 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;border:1px solid #eceef3;border-radius:18px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#676879;">
                        ${kindLabel}
                      </p>
                      <p style="margin:6px 0 0;font-family:'Source Serif 4',Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;font-weight:600;color:#1f2128;">
                        ${workName}
                      </p>
                      <p style="margin:8px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#676879;">
                        Invited by ${inviter}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="background:#ffffff;padding:28px 32px 12px;">
                <a href="${workUrl}" style="display:inline-block;background:#e04e1b;color:#ffffff;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;padding:14px 28px;">
                  Open the ${kindLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:0 0 28px 28px;padding:8px 32px 32px;">
                <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#676879;text-align:center;">
                  Prefer a direct link?<br />
                  <a href="${workUrl}" style="color:#c43d12;text-decoration:underline;word-break:break-all;">${workUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 8px 0;text-align:center;">
                <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#676879;">
                  Baguette keeps the plan, the board, and the weekly in one kitchen.
                </p>
                <p style="margin:8px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0ad;">
                  You received this because someone added you to a ${kindLabel}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const ROLE_NAME: Record<AccessRole, string> = {
  view: "View",
  admin: "Admin",
};

const ROLE_MEANING: Record<AccessRole, string> = {
  view: "You can open every project and portfolio this team gives you and read everything inside — the board, the timeline, the weekly status. You cannot change them.",
  admin: "You can edit the projects and portfolios this team gives you: add and move tasks, set up phases, rename work, and save the weekly status.",
};

export function roleChangedSubject(input: Pick<RoleChangedContent, "teamName" | "newRole">) {
  return `Your role on ${input.teamName} is now ${ROLE_NAME[input.newRole]}`;
}

export function roleChangedText(input: RoleChangedContent) {
  const first = input.recipientFirstName.trim() || "there";
  return [
    `Hi ${first},`,
    "",
    `${input.actorName} changed your role on the team "${input.teamName}" from ${ROLE_NAME[input.previousRole]} to ${ROLE_NAME[input.newRole]}.`,
    "",
    ROLE_MEANING[input.newRole],
    "",
    `Open Baguette: ${input.appUrl}`,
    "",
    `If you are not signed in, use this link: ${input.loginUrl}`,
    "",
    "Baguette — The project operating system",
  ].join("\n");
}

export function roleChangedHtml(input: RoleChangedContent) {
  const first = escapeHtml(input.recipientFirstName.trim() || "there");
  const actor = escapeHtml(input.actorName);
  const teamName = escapeHtml(input.teamName);
  const previous = escapeHtml(ROLE_NAME[input.previousRole]);
  const next = escapeHtml(ROLE_NAME[input.newRole]);
  const meaning = escapeHtml(ROLE_MEANING[input.newRole]);
  const appUrl = escapeHtml(input.appUrl);
  const loginUrl = escapeHtml(input.loginUrl);
  const preheader = `${input.actorName} changed your role on ${input.teamName} to ${ROLE_NAME[input.newRole]}.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(roleChangedSubject(input))}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;color:#1f2128;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:32px 16px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="background:#111318;border-radius:28px 28px 0 0;padding:28px 32px 26px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" height="32" align="center" valign="middle" style="background:#e04e1b;border-radius:10px;width:32px;height:32px;">
                      <span style="display:block;color:#fff4d5;font-family:Georgia,'Source Serif 4',serif;font-size:16px;line-height:32px;font-weight:700;">b</span>
                    </td>
                    <td style="padding-left:10px;color:#ffffff;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:18px;font-weight:600;letter-spacing:-0.02em;">
                      Baguette
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#ffb45a;">
                  Project operating system
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:36px 32px 8px;">
                <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#e04e1b;">
                  Role updated
                </p>
                <h1 style="margin:10px 0 0;font-family:'Source Serif 4',Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:600;color:#1f2128;">
                  You're now ${next} on ${teamName}.
                </h1>
                <p style="margin:18px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#323338;">
                  Hi ${first} — ${actor} changed your role on this team. ${meaning}
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:22px 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;border:1px solid #eceef3;border-radius:18px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#676879;">
                        ${teamName}
                      </p>
                      <p style="margin:6px 0 0;font-family:'Source Serif 4',Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;font-weight:600;color:#1f2128;">
                        ${previous} &rarr; ${next}
                      </p>
                      <p style="margin:8px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#676879;">
                        Changed by ${actor}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="background:#ffffff;padding:28px 32px 12px;">
                <a href="${loginUrl}" style="display:inline-block;background:#e04e1b;color:#ffffff;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;padding:14px 28px;">
                  Open Baguette
                </a>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:0 0 28px 28px;padding:8px 32px 32px;">
                <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#676879;text-align:center;">
                  Prefer a direct link?<br />
                  <a href="${appUrl}" style="color:#c43d12;text-decoration:underline;word-break:break-all;">${appUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 8px 0;text-align:center;">
                <p style="margin:0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#676879;">
                  Baguette keeps the plan, the board, and the weekly in one kitchen.
                </p>
                <p style="margin:8px 0 0;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0ad;">
                  You received this because your role on a team changed.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
