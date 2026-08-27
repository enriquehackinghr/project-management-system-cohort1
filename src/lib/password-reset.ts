import "server-only";

import { getPasswordResetByTokenHash } from "./db";
import { hashResetToken, RESET_TOKEN_TTL_MINUTES } from "./password";

export function resetTokenExpiry(from = new Date()) {
  return new Date(from.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

export async function isResetTokenUsable(token: string) {
  const candidate = token.trim();
  if (!candidate) return false;
  const reset = await getPasswordResetByTokenHash(hashResetToken(candidate));
  if (!reset || reset.used_at) return false;
  return new Date(reset.expires_at) > new Date();
}
