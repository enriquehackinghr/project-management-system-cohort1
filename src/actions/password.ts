"use server";

import { redirect } from "next/navigation";
import {
  consumePasswordReset,
  createPasswordReset,
  getAccountByPersonId,
  getPersonByEmail,
} from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import {
  createResetToken,
  hashResetToken,
  hashPassword,
  RESET_TOKEN_TTL_MINUTES,
} from "@/lib/password";
import { resetTokenExpiry } from "@/lib/password-reset";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormState,
  type ResetPasswordFormState,
} from "@/lib/schemas";

/**
 * Always reports success. Telling a stranger whether an email has an account
 * would turn this form into an account directory.
 */
export async function requestPasswordReset(
  _state: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values };
  }

  const { email } = parsed.data;

  try {
    const person = await getPersonByEmail(email);
    const account = person ? await getAccountByPersonId(person.id) : null;
    if (person && account) {
      const token = createResetToken();
      await createPasswordReset({
        personId: person.id,
        tokenHash: hashResetToken(token),
        expiresAt: resetTokenExpiry().toISOString(),
      });
      await sendPasswordResetEmail({
        to: person.email,
        recipientFirstName: person.first_name,
        token,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      });
    }
  } catch (error) {
    console.error("Password reset request failed", error);
    return {
      message: "Could not start the reset. Try again.",
      values,
    };
  }

  return { sent: true, values };
}

export async function resetPassword(
  _state: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.token?.length) {
      return { expired: true, message: fieldErrors.token[0] };
    }
    return { errors: fieldErrors };
  }

  const { token, password } = parsed.data;

  try {
    const result = await consumePasswordReset({
      tokenHash: hashResetToken(token),
      passwordHash: await hashPassword(password),
    });
    if (!result.ok) {
      return {
        expired: true,
        message: "This reset link has expired or was already used.",
      };
    }
  } catch (error) {
    console.error("Password reset failed", error);
    return { message: "Could not reset your password. Try again." };
  }

  redirect("/login?reset=1");
}
