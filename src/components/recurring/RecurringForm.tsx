"use client";

import { useActionState, useEffect, useState } from "react";
import { SelectField, TextAreaField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";
import type { CategoryOption } from "@/components/transactions/TransactionForm";

export function RecurringForm({
  action,
  categories,
  onSuccess,
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  categories: CategoryOption[];
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(action, undefined as ActionResult | undefined);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  useEffect(() => {
    if (state?.ok) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const filteredCategories = categories.filter((c) => c.kind === type);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setType("EXPENSE")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${type === "EXPENSE" ? "border-expense bg-red-50 text-expense" : "border-slate-300 text-slate-500"}`}>
          Expense
        </button>
        <button type="button" onClick={() => setType("INCOME")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${type === "INCOME" ? "border-income bg-brand-50 text-income" : "border-slate-300 text-slate-500"}`}>
          Income
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Amount (USD)" name="amount" inputMode="decimal" required errors={errors?.amount} />
        <SelectField label="Frequency" name="frequency" defaultValue="MONTHLY" errors={errors?.frequency}>
          <option value="WEEKLY">Weekly</option>
          <option value="BIWEEKLY">Every 2 weeks</option>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="ANNUALLY">Annually</option>
        </SelectField>
      </div>

      <SelectField label="Category" name="categoryId" defaultValue="" errors={errors?.categoryId}>
        <option value="">Uncategorized</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Start date" name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} errors={errors?.startDate} />
        <TextField label="End date (optional)" name="endDate" type="date" errors={errors?.endDate} />
      </div>

      <TextField label={type === "EXPENSE" ? "Merchant" : "Source"} name="merchant" errors={errors?.merchant} />
      <TextField label="Description (optional)" name="description" errors={errors?.description} />
      <TextAreaField label="Notes (optional)" name="notes" errors={errors?.notes} />

      <div className="flex justify-end pt-2">
        <SubmitButton>Create recurring transaction</SubmitButton>
      </div>
    </form>
  );
}
