"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { copyBudgetSchema, monthlyBudgetInputSchema } from "@/lib/validation/budget";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

/** Creates or replaces the full set of category allocations for one month. */
export async function saveMonthlyBudget(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const rawAllocations = JSON.parse(String(formData.get("allocations") || "[]"));
  const parsed = monthlyBudgetInputSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
    allocations: rawAllocations,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const categoryIds = parsed.data.allocations.map((a) => a.categoryId);
  const ownedCategories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, OR: [{ userId }, { userId: null }], kind: "EXPENSE" },
    select: { id: true },
  });
  if (ownedCategories.length !== new Set(categoryIds).size) {
    return errorResult("One or more selected categories are not available.");
  }

  const budget = await prisma.monthlyBudget.upsert({
    where: { userId_year_month: { userId, year: parsed.data.year, month: parsed.data.month } },
    update: {},
    create: { userId, year: parsed.data.year, month: parsed.data.month },
  });

  await prisma.$transaction([
    prisma.budgetCategory.deleteMany({ where: { budgetId: budget.id } }),
    prisma.budgetCategory.createMany({
      data: parsed.data.allocations.map((a) => ({
        budgetId: budget.id,
        categoryId: a.categoryId,
        amountLimit: parseAmountToCents(a.amountLimit),
      })),
    }),
  ]);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return okResult(undefined);
}

export async function deleteMonthlyBudget(budgetId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const budget = await prisma.monthlyBudget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) return errorResult("Budget not found.");

  await prisma.monthlyBudget.delete({ where: { id: budgetId } });
  revalidatePath("/budgets");
  return okResult(undefined);
}

export async function copyBudgetFromMonth(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = copyBudgetSchema.safeParse({
    fromMonth: formData.get("fromMonth"),
    fromYear: formData.get("fromYear"),
    toMonth: formData.get("toMonth"),
    toYear: formData.get("toYear"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const source = await prisma.monthlyBudget.findUnique({
    where: {
      userId_year_month: { userId, year: parsed.data.fromYear, month: parsed.data.fromMonth },
    },
    include: { categories: true },
  });
  if (!source || source.categories.length === 0) {
    return errorResult("The month you selected has no budget to copy.");
  }

  const target = await prisma.monthlyBudget.upsert({
    where: {
      userId_year_month: { userId, year: parsed.data.toYear, month: parsed.data.toMonth },
    },
    update: {},
    create: { userId, year: parsed.data.toYear, month: parsed.data.toMonth },
  });

  await prisma.$transaction([
    prisma.budgetCategory.deleteMany({ where: { budgetId: target.id } }),
    prisma.budgetCategory.createMany({
      data: source.categories.map((c) => ({
        budgetId: target.id,
        categoryId: c.categoryId,
        amountLimit: c.amountLimit,
      })),
    }),
  ]);

  revalidatePath("/budgets");
  return okResult(undefined);
}
