/**
 * Debt payoff simulation — Avalanche (highest APR first) vs. Snowball
 * (smallest balance first). Pure functions, no I/O, so this is fully
 * unit-testable (see tests/debtPayoff.test.ts).
 *
 * The simulation runs month by month: interest accrues on every open debt,
 * minimum payments are applied to all of them, then any extra monthly
 * payment — plus the minimum payments freed up by debts already paid off —
 * is funneled to the single highest-priority debt still open, cascading to
 * the next one if it's paid off with room to spare in the same month.
 */

export type PayoffStrategy = "AVALANCHE" | "SNOWBALL";

export type DebtInput = {
  id: string;
  name: string;
  balanceCents: number;
  aprPercent: number; // e.g. 24.99 for 24.99% APR
  minPaymentCents: number;
};

export type DebtPayoffOrderEntry = {
  id: string;
  name: string;
  payoffMonth: number;
};

export type PayoffResult = {
  strategy: PayoffStrategy;
  totalMonths: number;
  totalInterestCents: number;
  totalPaidCents: number;
  order: DebtPayoffOrderEntry[];
  /** True if the simulation hit its safety cap with balance still remaining —
   * meaning minimum payments (plus any extra) don't cover accruing interest,
   * so this debt load is never actually paid off as configured. */
  stalled: boolean;
};

const MAX_MONTHS = 600; // 50-year safety cap against infinite loops

function sortByStrategy(debts: DebtInput[], strategy: PayoffStrategy): DebtInput[] {
  return [...debts].sort((a, b) =>
    strategy === "AVALANCHE"
      ? b.aprPercent - a.aprPercent || a.balanceCents - b.balanceCents
      : a.balanceCents - b.balanceCents || b.aprPercent - a.aprPercent,
  );
}

export function simulatePayoff(
  debts: DebtInput[],
  extraMonthlyCents: number,
  strategy: PayoffStrategy,
): PayoffResult {
  if (debts.length === 0) {
    return { strategy, totalMonths: 0, totalInterestCents: 0, totalPaidCents: 0, order: [], stalled: false };
  }

  const ordered = sortByStrategy(debts, strategy);
  const balance = new Map(ordered.map((d) => [d.id, d.balanceCents]));
  const payoffMonth = new Map<string, number>();
  let month = 0;
  let totalInterestCents = 0;
  let totalPaidCents = 0;

  const isOpen = (id: string) => (balance.get(id) ?? 0) > 0;

  while (ordered.some((d) => isOpen(d.id)) && month < MAX_MONTHS) {
    month++;

    // 1. Accrue interest and apply minimum payments to every still-open debt.
    //    A debt already paid off in a prior month frees its minimum payment
    //    up to redirect toward the priority target this month.
    let freedMinimumsCents = 0;
    for (const d of ordered) {
      if (!isOpen(d.id)) {
        freedMinimumsCents += d.minPaymentCents;
        continue;
      }
      let bal = balance.get(d.id)!;
      const interest = Math.round(bal * (d.aprPercent / 100 / 12));
      totalInterestCents += interest;
      bal += interest;
      const payment = Math.min(d.minPaymentCents, bal);
      bal -= payment;
      totalPaidCents += payment;
      balance.set(d.id, bal);
      if (bal <= 0) payoffMonth.set(d.id, month);
    }

    // 2. Funnel the extra payment (+ freed minimums) to the priority debt,
    //    cascading to the next one if it's paid off with room to spare.
    let pool = extraMonthlyCents + freedMinimumsCents;
    for (const d of ordered) {
      if (pool <= 0) break;
      const bal = balance.get(d.id)!;
      if (bal <= 0) continue;
      const extraPay = Math.min(pool, bal);
      const newBal = bal - extraPay;
      pool -= extraPay;
      totalPaidCents += extraPay;
      balance.set(d.id, newBal);
      if (newBal <= 0) payoffMonth.set(d.id, month);
    }
  }

  const stalled = ordered.some((d) => isOpen(d.id));

  return {
    strategy,
    totalMonths: month,
    totalInterestCents,
    totalPaidCents,
    order: ordered.map((d) => ({ id: d.id, name: d.name, payoffMonth: payoffMonth.get(d.id) ?? month })),
    stalled,
  };
}
