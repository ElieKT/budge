"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField, FormBanner } from "@/components/ui/Field";
import { completeOnboarding, skipOnboarding } from "@/server/actions/onboarding";
import { saveMonthlyBudget } from "@/server/actions/budgets";
import { createTransaction } from "@/server/actions/transactions";
import { createSavingsGoal } from "@/server/actions/savingsGoals";
import { CURRENCIES } from "@/lib/currencies";

type Category = { id: string; name: string };

const STEPS = ["currency", "income", "budget", "expense", "goal"] as const;

export function OnboardingWizard({ expenseCategories }: { expenseCategories: Category[] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [currency, setCurrency] = useState("USD");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [budgetCategoryId, setBudgetCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMerchant, setExpenseMerchant] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function next() {
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function finish() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("currency", currency);
      if (monthlyIncome) fd.set("monthlyIncomeEstimate", monthlyIncome);
      const result = await completeOnboarding(undefined, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleSkipAll() {
    startTransition(async () => {
      await skipOnboarding();
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleContinue() {
    setError(null);

    if (step === "budget" && budgetCategoryId && budgetAmount) {
      startTransition(async () => {
        const now = new Date();
        const fd = new FormData();
        fd.set("month", String(now.getMonth() + 1));
        fd.set("year", String(now.getFullYear()));
        fd.set("allocations", JSON.stringify([{ categoryId: budgetCategoryId, amountLimit: budgetAmount }]));
        const result = await saveMonthlyBudget(undefined, fd);
        if (!result.ok) return setError(result.error);
        next();
      });
      return;
    }

    if (step === "expense" && expenseCategoryId && expenseAmount) {
      startTransition(async () => {
        const fd = new FormData();
        fd.set("type", "EXPENSE");
        fd.set("amount", expenseAmount);
        fd.set("date", new Date().toISOString().slice(0, 10));
        fd.set("categoryId", expenseCategoryId);
        if (expenseMerchant) fd.set("merchant", expenseMerchant);
        const result = await createTransaction(undefined, fd);
        if (!result.ok) return setError(result.error);
        next();
      });
      return;
    }

    if (step === "goal" && goalName && goalTarget) {
      startTransition(async () => {
        const fd = new FormData();
        fd.set("name", goalName);
        fd.set("targetAmount", goalTarget);
        const result = await createSavingsGoal(undefined, fd);
        if (!result.ok) return setError(result.error);
        finish();
      });
      return;
    }

    if (isLast) {
      finish();
    } else {
      next();
    }
  }

  return (
    <div className="card">
      <div className="mb-4 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-brand-500" : "bg-slate-200"}`} />
        ))}
      </div>

      {error && <div className="mb-4"><FormBanner message={error} /></div>}

      {step === "currency" && (
        <div>
          <h2 className="text-base font-semibold">Your currency</h2>
          <p className="mt-1 text-sm text-slate-500">
            This sets how amounts are displayed. You can change it later in Settings — note it
            doesn&apos;t convert amounts you&apos;ve already entered, it just changes the label going
            forward.
          </p>
          <SelectField label="Currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-4">
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </SelectField>
        </div>
      )}

      {step === "income" && (
        <div>
          <h2 className="text-base font-semibold">Approximate monthly income</h2>
          <p className="mt-1 text-sm text-slate-500">Optional — helps tailor your dashboard. You can change this later in Settings.</p>
          <TextField
            label="Monthly income (USD)"
            name="monthlyIncome"
            inputMode="decimal"
            placeholder="e.g. 4500"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="mt-4"
          />
        </div>
      )}

      {step === "budget" && (
        <div>
          <h2 className="text-base font-semibold">Create your first budget</h2>
          <p className="mt-1 text-sm text-slate-500">Optional — set a spending limit for one category this month.</p>
          <div className="mt-4 space-y-3">
            <SelectField label="Category" name="budgetCategory" value={budgetCategoryId} onChange={(e) => setBudgetCategoryId(e.target.value)}>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <TextField label="Monthly limit (USD)" name="budgetAmount" inputMode="decimal" placeholder="e.g. 400" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
          </div>
        </div>
      )}

      {step === "expense" && (
        <div>
          <h2 className="text-base font-semibold">Add your first expense</h2>
          <p className="mt-1 text-sm text-slate-500">Optional — try logging something you spent recently.</p>
          <div className="mt-4 space-y-3">
            <SelectField label="Category" name="expenseCategory" value={expenseCategoryId} onChange={(e) => setExpenseCategoryId(e.target.value)}>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <TextField label="Amount (USD)" name="expenseAmount" inputMode="decimal" placeholder="e.g. 42.50" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            <TextField label="Merchant (optional)" name="expenseMerchant" placeholder="e.g. Trader Joe's" value={expenseMerchant} onChange={(e) => setExpenseMerchant(e.target.value)} />
          </div>
        </div>
      )}

      {step === "goal" && (
        <div>
          <h2 className="text-base font-semibold">Create a savings goal</h2>
          <p className="mt-1 text-sm text-slate-500">Optional — you can always add this later.</p>
          <div className="mt-4 space-y-3">
            <TextField label="Goal name" name="goalName" placeholder="e.g. Emergency fund" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            <TextField label="Target amount (USD)" name="goalTarget" inputMode="decimal" placeholder="e.g. 5000" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={handleSkipAll} className="text-sm text-slate-400 hover:text-slate-600" disabled={pending}>
          Skip setup
        </button>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="secondary" onClick={() => setStepIndex((i) => i - 1)} disabled={pending}>
              Back
            </Button>
          )}
          <Button type="button" onClick={handleContinue} disabled={pending}>
            {pending ? "Saving…" : isLast ? "Finish" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
