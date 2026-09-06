import type { TransactionType } from "@prisma/client";

/**
 * System default categories, seeded once with userId = null (see
 * prisma/seed.ts) and visible to every user. Users can additionally create
 * their own categories (userId set) and cannot edit/delete these defaults.
 */
export const DEFAULT_EXPENSE_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: "Housing", color: "#7c3aed" },
  { name: "Utilities", color: "#2563eb" },
  { name: "Groceries", color: "#059669" },
  { name: "Transport", color: "#0891b2" },
  { name: "Insurance", color: "#4f46e5" },
  { name: "Healthcare", color: "#db2777" },
  { name: "Childcare", color: "#d97706" },
  { name: "Debt Payments", color: "#dc2626" },
  { name: "Entertainment", color: "#ca8a04" },
  { name: "Shopping", color: "#9333ea" },
  { name: "Dining", color: "#ea580c" },
  { name: "Education", color: "#0d9488" },
  { name: "Savings", color: "#16a34a" },
  { name: "Other", color: "#6b7280" },
];

export const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: "Salary", color: "#159d63" },
  { name: "Freelance", color: "#0891b2" },
  { name: "Investment", color: "#4f46e5" },
  { name: "Gift", color: "#d97706" },
  { name: "Other Income", color: "#6b7280" },
];

export function defaultCategoriesFor(kind: TransactionType) {
  return kind === "EXPENSE" ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
}
