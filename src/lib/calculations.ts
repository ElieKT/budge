/**
 * Pure, DB-free financial calculations shared by the dashboard, reports, and
 * budget pages. Keeping these free of Prisma/Next imports means they can be
 * unit-tested directly (see tests/calculations.test.ts) and reused anywhere
 * the same numbers need to be computed consistently — never re-derive these
 * formulas ad hoc in a component.
 *
 * All amounts in and out are integer minor units (cents).
 */

export type CalcTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryId: string | null;
};

export function totalIncome(transactions: CalcTransaction[]): number {
  return transactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
}

export function totalExpenses(transactions: CalcTransaction[]): number {
  return transactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
}

/** Net cash flow = income - expenses. May be negative. */
export function netCashFlow(transactions: CalcTransaction[]): number {
  return totalIncome(transactions) - totalExpenses(transactions);
}

/** Sum of expense transactions assigned to a given category. */
export function categorySpend(transactions: CalcTransaction[], categoryId: string): number {
  return transactions
    .filter((t) => t.type === "EXPENSE" && t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Groups expense totals by category id ("uncategorized" for null). */
export function spendByCategory(transactions: CalcTransaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.categoryId ?? "uncategorized";
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return map;
}

/** Remaining budget for a category = limit - spent. Can go negative (over budget). */
export function remainingBudget(limit: number, spent: number): number {
  return limit - spent;
}

/** Percentage of a category budget used, clamped at 0 and uncapped above 100. */
export function budgetUsedPercentage(limit: number, spent: number): number {
  if (limit <= 0) return spent > 0 ? 100 : 0;
  return Math.max(0, Math.round((spent / limit) * 100));
}

export type BudgetStatus = "under" | "warning" | "over";

/** Visual/alerting threshold: "warning" from 90% up to (not including) 100%. */
export function budgetStatus(limit: number, spent: number): BudgetStatus {
  const pct = budgetUsedPercentage(limit, spent);
  if (pct >= 100) return "over";
  if (pct >= 90) return "warning";
  return "under";
}

/**
 * Savings progress = current / target, as a 0-100+ percentage. Guards the
 * divide-by-zero and negative-target cases explicitly (returns 0) rather
 * than producing NaN/Infinity.
 */
export function savingsProgressPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.round((current / target) * 100));
}

export function remainingOverallBudget(totalPlanned: number, totalSpent: number): number {
  return totalPlanned - totalSpent;
}

// ---------------------------------------------------------------------------
// Net worth (financial accounts + investment holdings)
// ---------------------------------------------------------------------------

export type LiabilityAccountType = "CREDIT_CARD" | "LOAN";
const LIABILITY_TYPES: ReadonlySet<string> = new Set<LiabilityAccountType>(["CREDIT_CARD", "LOAN"]);

export type CalcAccount = { type: string; currentBalance: number };

/** True for account types that represent money owed, not money held. */
export function isLiabilityAccountType(type: string): boolean {
  return LIABILITY_TYPES.has(type);
}

/**
 * Net worth = sum of asset account balances - sum of liability account
 * balances. Liability balances (credit cards, loans) are stored positive
 * (the amount owed), so they're subtracted rather than added.
 */
export function netWorth(accounts: CalcAccount[]): number {
  return accounts.reduce((sum, a) => sum + (isLiabilityAccountType(a.type) ? -a.currentBalance : a.currentBalance), 0);
}

// ---------------------------------------------------------------------------
// Household shared-expense ledger
// ---------------------------------------------------------------------------

export type CalcSharedExpense = {
  paidByUserId: string;
  splits: { userId: string; shareAmount: number }[];
};

/**
 * Net balance per user across a household's shared expenses: positive means
 * the household owes that user money (they paid more than their share),
 * negative means that user owes the household. Purely a ledger computation
 * — no money ever moves as a result of this number.
 */
export function householdNetBalances(expenses: CalcSharedExpense[]): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (userId: string, delta: number) => balances.set(userId, (balances.get(userId) ?? 0) + delta);

  for (const expense of expenses) {
    const total = expense.splits.reduce((sum, s) => sum + s.shareAmount, 0);
    add(expense.paidByUserId, total); // the payer is owed the full amount...
    for (const split of expense.splits) {
      add(split.userId, -split.shareAmount); // ...minus what they themselves owe
    }
  }
  return balances;
}
