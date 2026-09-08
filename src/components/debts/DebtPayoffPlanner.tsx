"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { formatCurrency } from "@/lib/money";
import { TextField } from "@/components/ui/Field";
import { simulatePayoff, type DebtInput, type PayoffResult, type PayoffStrategy } from "@/lib/debtPayoff";

type Debt = { id: string; name: string; balance: number; apr: number; minPayment: number };

function StrategySummary({
  label,
  result,
  active,
  onSelect,
  currency,
}: {
  label: string;
  result: PayoffResult;
  active: boolean;
  onSelect: () => void;
  currency: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
      )}
    >
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
      {result.stalled ? (
        <p className="mt-1 text-sm text-expense">Never pays off at these payments</p>
      ) : (
        <>
          <p className="mt-1 text-lg font-semibold tabular-nums">{result.totalMonths} months</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(result.totalInterestCents, currency)} interest</p>
        </>
      )}
    </button>
  );
}

export function DebtPayoffPlanner({ debts, currency = "USD" }: { debts: Debt[]; currency?: string }) {
  const [extra, setExtra] = useState("0");
  const [strategy, setStrategy] = useState<PayoffStrategy>("AVALANCHE");

  const extraCents = Math.max(0, Math.round((Number(extra) || 0) * 100));
  const debtInputs: DebtInput[] = useMemo(
    () => debts.map((d) => ({ id: d.id, name: d.name, balanceCents: d.balance, aprPercent: d.apr, minPaymentCents: d.minPayment })),
    [debts],
  );

  const avalanche = useMemo(() => simulatePayoff(debtInputs, extraCents, "AVALANCHE"), [debtInputs, extraCents]);
  const snowball = useMemo(() => simulatePayoff(debtInputs, extraCents, "SNOWBALL"), [debtInputs, extraCents]);
  const selected = strategy === "AVALANCHE" ? avalanche : snowball;

  const totalMinimums = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const interestDifference = snowball.totalInterestCents - avalanche.totalInterestCents;

  const debtFreeDate = useMemo(() => {
    if (selected.stalled || selected.totalMonths === 0) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + selected.totalMonths);
    return d;
  }, [selected]);

  if (debts.length === 0) return null;

  return (
    <div className="card">
      <h2 className="mb-1 text-base font-semibold">Payoff planner</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Minimum payments alone total {formatCurrency(totalMinimums, currency)}/month. Add anything extra
        you can put toward debt to see how much faster — and cheaper — it goes.
      </p>

      <TextField
        label="Extra monthly payment (USD)"
        name="extraPayment"
        inputMode="decimal"
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
        className="mb-4 max-w-xs"
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StrategySummary label="Avalanche (highest APR first)" result={avalanche} active={strategy === "AVALANCHE"} onSelect={() => setStrategy("AVALANCHE")} currency={currency} />
        <StrategySummary label="Snowball (smallest balance first)" result={snowball} active={strategy === "SNOWBALL"} onSelect={() => setStrategy("SNOWBALL")} currency={currency} />
      </div>

      {!avalanche.stalled && !snowball.stalled && interestDifference !== 0 && (
        <p className="mb-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          Avalanche saves {formatCurrency(Math.abs(interestDifference), currency)} in interest compared to Snowball with these
          numbers — Snowball can still be worth it if paying off small balances first keeps you motivated.
        </p>
      )}

      {selected.stalled ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          At these payments, interest is accruing faster than it&apos;s being paid down for the {strategy === "AVALANCHE" ? "avalanche" : "snowball"} plan —
          this debt load won&apos;t actually shrink. Increase a minimum payment or the extra amount above.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Debt-free in</p>
              <p className="text-xl font-semibold tabular-nums">{selected.totalMonths} months</p>
              {debtFreeDate && (
                <p className="text-xs text-slate-400">
                  {debtFreeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total interest paid</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(selected.totalInterestCents, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total paid</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(selected.totalPaidCents, currency)}</p>
            </div>
          </div>

          <ol className="mt-4 space-y-2 text-sm">
            {selected.order.map((d, i) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 dark:bg-slate-800">
                <span className="text-slate-700 dark:text-slate-200">
                  {i + 1}. {d.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400">paid off month {d.payoffMonth}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
