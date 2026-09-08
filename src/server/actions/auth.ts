"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { reconcileHouseholdAfterMemberLeft } from "@/server/data/household";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/lib/validation/auth";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function registerUser(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorResult("An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      preference: { create: {} },
    },
  });

  return okResult(undefined);
}

export async function loginAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    // NextAuth's redirect() throws NEXT_REDIRECT internally on success — rethrow it.
    if (error instanceof AuthError) {
      return errorResult("Incorrect email or password.");
    }
    throw error;
  }
  return okResult(undefined);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordReset(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always return success regardless of whether the account exists, so this
  // endpoint can't be used to enumerate registered email addresses.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return okResult(undefined);
}

export async function resetPassword(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return errorResult("This reset link is invalid or has expired. Request a new one.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return okResult(undefined);
}

export async function changePassword(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return errorResult("Current password is incorrect.");

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return okResult(undefined);
}

export async function updateProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = updateProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  return okResult(undefined);
}

export async function deleteAccount(): Promise<void> {
  const userId = await requireUserId();

  // Household has no direct owner foreign key (only via HouseholdMember), so
  // the cascade below removes this user's membership row but never an
  // otherwise-empty household — reconciled explicitly afterward, the same
  // way leaving a household through the UI already is.
  const householdIds = (
    await prisma.householdMember.findMany({ where: { userId }, select: { householdId: true } })
  ).map((m) => m.householdId);

  // Cascading FKs (see prisma/schema.prisma) remove every other owned
  // record — transactions, budgets, savings goals, categories, sessions,
  // household memberships, etc.
  await prisma.user.delete({ where: { id: userId } });

  for (const householdId of householdIds) {
    await reconcileHouseholdAfterMemberLeft(householdId);
  }

  await signOut({ redirectTo: "/" });
}
