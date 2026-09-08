"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormBanner, TextField } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/money";
import { BUDGET_TEMPLATES, computeTemplateAllocations, type BudgetTemplateKey } from "@/lib/budgetTemplates";
import { applyBudgetTemplate } from "@/server/actions/budgets";

export function BudgetTemplateModal({
  year,
  month,
  defaultMonthlyIncome,
}: {
  year: number;
  month: number;
  defaultMonthlyIncome: string;
}) {
  const [open, setOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState<BudgetTemplateKey>("BALANCED");
  const [income, setIncome] = useState(defaultMonthlyIncome);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const incomeCents = Math.round((Number(income) || 0) * 100);
  const preview = useMemo(() => computeTemplateAllocations(templateKey, incomeCents), [templateKey, incomeCents]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("templateKey", templateKey);
      fd.set("monthlyIncome", income);
      fd.set("month", String(month));
      fd.set("year", String(year));
      const result = await applyBudgetTemplate(undefined, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Use a template</Button>
      {open && (
        <Modal title="Start from a budget template" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            {error && <FormBanner message={error} />}
            <p className="text-sm text-slate-500">
              A starting point, not advice — every amount is fully editable after you apply it, and
              this replaces this month&apos;s budget for the categories it covers.
            </p>

            <div className="space-y-2">
              {(Object.keys(BUDGET_TEMPLATES) as BudgetTemplateKey[]).map((key) => {
                const t = BUDGET_TEMPLATES[key];
                return (
                  <label
                    key={key}
                    className={`block cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                      templateKey === key ? "border-brand-500 bg-brand-50 dark:bg-brand-950" : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <input type="radio" name="template" className="sr-only" checked={templateKey === key} onChange={() => setTemplateKey(key)} />
                    <span className="font-medium text-slate-800 dark:text-slate-100">{t.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{t.description}</span>
                  </label>
                );
              })}
            </div>

            <TextField
              label="Monthly income (USD)"
              name="monthlyIncome"
              inputMode="decimal"
              placeholder="e.g. 4500"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />

            {incomeCents > 0 && (
              <div>
                <p className="label">Preview</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  {preview.map((a) => (
                    <li key={a.categoryName} className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{a.categoryName}</span>
                      <span className="tabular-nums font-medium text-slate-800 dark:text-slate-100">{formatCurrency(a.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button onClick={submit} disabled={pending || incomeCents <= 0}>
                {pending ? "Applying…" : "Apply template"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
