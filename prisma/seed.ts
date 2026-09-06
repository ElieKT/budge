/**
 * Seeds system default categories (idempotent — safe to re-run).
 *
 * Optionally also seeds a demo account with a few months of sample
 * transactions when SEED_DEMO_USER=true, purely for local development /
 * screenshots. Never run with SEED_DEMO_USER set against a production
 * database.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "../src/lib/categories";

const prisma = new PrismaClient();

async function ensureDefaultCategory(name: string, kind: "INCOME" | "EXPENSE", color: string) {
  // Compound unique indexes with a nullable column (userId) can't be used
  // with findUnique/upsert's whereUnique input, so default (userId: null)
  // rows are de-duplicated with findFirst instead.
  const existing = await prisma.category.findFirst({ where: { userId: null, name, kind } });
  if (!existing) {
    await prisma.category.create({ data: { name, kind, color, isDefault: true, userId: null } });
  }
}

async function seedDefaultCategories() {
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await ensureDefaultCategory(cat.name, "EXPENSE", cat.color);
  }
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await ensureDefaultCategory(cat.name, "INCOME", cat.color);
  }

  console.log(
    `Seeded ${DEFAULT_EXPENSE_CATEGORIES.length} expense + ${DEFAULT_INCOME_CATEGORIES.length} income default categories.`,
  );
}

async function seedDemoUser() {
  const email = "demo@budge.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("Demo1234!", 12);
  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email,
      passwordHash,
      preference: { create: { currency: "USD", onboardingCompletedAt: new Date() } },
    },
  });

  const groceries = await prisma.category.findFirst({ where: { userId: null, name: "Groceries" } });
  const salary = await prisma.category.findFirst({ where: { userId: null, name: "Salary" } });
  const dining = await prisma.category.findFirst({ where: { userId: null, name: "Dining" } });

  const now = new Date();
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: "INCOME",
        amount: 450000,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        description: "Paycheck",
        categoryId: salary?.id,
      },
      {
        userId: user.id,
        type: "EXPENSE",
        amount: 12500,
        date: new Date(now.getFullYear(), now.getMonth(), 3),
        merchant: "Whole Foods",
        categoryId: groceries?.id,
      },
      {
        userId: user.id,
        type: "EXPENSE",
        amount: 4200,
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        merchant: "Corner Bistro",
        categoryId: dining?.id,
      },
    ],
  });

  if (groceries) {
    const budget = await prisma.monthlyBudget.create({
      data: { userId: user.id, month: now.getMonth() + 1, year: now.getFullYear() },
    });
    await prisma.budgetCategory.create({
      data: { budgetId: budget.id, categoryId: groceries.id, amountLimit: 40000 },
    });
  }

  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: "Emergency fund",
      targetAmount: 500000,
      currentAmount: 125000,
      targetDate: new Date(now.getFullYear() + 1, 0, 1),
    },
  });

  console.log(`Seeded demo user: ${email} / Demo1234!`);
}

async function main() {
  await seedDefaultCategories();
  if (process.env.SEED_DEMO_USER === "true") {
    await seedDemoUser();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
