"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { contactMessageSchema } from "@/lib/validation/contact";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

/** Public — no auth required, since the Help page's contact form is
 * reachable while signed out. `company` is a honeypot field: hidden from
 * real visitors via CSS, so anything that fills it is almost certainly a
 * bot — pretend success without ever writing it to the database. */
export async function submitContactMessage(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (formData.get("company")) {
    return okResult(undefined);
  }

  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.contactMessage.create({ data: parsed.data });
  return okResult(undefined);
}

export async function setMessageResolved(id: string, isResolved: boolean): Promise<ActionResult> {
  await requireAdmin();
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) return errorResult("Message not found.");

  await prisma.contactMessage.update({ where: { id }, data: { isResolved } });
  revalidatePath("/admin/messages");
  return okResult(undefined);
}
