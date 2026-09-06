"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { categoryInputSchema } from "@/lib/validation/category";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function createCategory(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const duplicate = await prisma.category.findFirst({
    where: { OR: [{ userId }, { userId: null }], name: parsed.data.name, kind: parsed.data.kind },
  });
  if (duplicate) return errorResult("You already have a category with that name.");

  await prisma.category.create({
    data: { ...parsed.data, userId },
  });
  revalidatePath("/categories");
  return okResult(undefined);
}

export async function updateCategory(
  categoryId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  // Ownership check: only ever update a category that belongs to this user.
  // Default (userId: null) categories are read-only for everyone.
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) return errorResult("Category not found.");

  await prisma.category.update({ where: { id: categoryId }, data: parsed.data });
  revalidatePath("/categories");
  return okResult(undefined);
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) return errorResult("Category not found.");

  // Transactions referencing this category fall back to "Uncategorized"
  // (categoryId SetNull) rather than being deleted — see schema comment.
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return okResult(undefined);
}
