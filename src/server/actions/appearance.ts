"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES, appearanceInputSchema, localeInputSchema } from "@/lib/validation/appearance";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function uploadAvatar(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return errorResult("Choose an image to upload.");
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return errorResult("Please upload a PNG, JPEG, or WebP image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return errorResult(`That image is too large — please use one under ${MAX_AVATAR_BYTES / 1024}KB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.user.update({ where: { id: userId }, data: { image: dataUrl } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function removeAvatar(): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function updateAppearance(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = appearanceInputSchema.safeParse({
    theme: formData.get("theme"),
    accentColor: formData.get("accentColor"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.userPreference.upsert({
    where: { userId },
    update: { theme: parsed.data.theme, accentColor: parsed.data.accentColor },
    create: { userId, theme: parsed.data.theme, accentColor: parsed.data.accentColor },
  });

  // Theme/accent are applied in the root layout on every request, so a
  // full revalidation is needed for the change to show up immediately.
  revalidatePath("/", "layout");
  return okResult(undefined);
}

export async function updateLocale(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = localeInputSchema.safeParse({ locale: formData.get("locale") });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.userPreference.upsert({
    where: { userId },
    update: { locale: parsed.data.locale },
    create: { userId, locale: parsed.data.locale },
  });

  revalidatePath("/", "layout");
  return okResult(undefined);
}
