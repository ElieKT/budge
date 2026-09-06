"use client";

import { useActionState, useEffect, useState } from "react";
import { SelectField, TextAreaField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export type CategoryOption = { id: string; name: string; kind: "INCOME" | "EXPENSE" };

export type TransactionFormValues = {
  type: "INCOME" | "EXPENSE";
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  merchant: string;
  notes: string;
};

export function TransactionForm({
  action,
  categories,
  defaultValues,
  onSuccess,
  submitLabel = "Save transaction",
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  categories: CategoryOption[];
  defaultValues?: Partial<TransactionFormValues>;
  onSuccess: () => void;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined as ActionResult | undefined);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(defaultValues?.type ?? "EXPENSE");

  useEffect(() => {
    if (state?.ok) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const filteredCategories = categories.filter((c) => c.kind === type);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            type === "EXPENSE" ? "border-expense bg-red-50 text-expense" : "border-slate-300 text-slate-500"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            type === "INCOME" ? "border-income bg-brand-50 text-income" : "border-slate-300 text-slate-500"
          }`}
        >
          Income
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Amount (USD)"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={defaultValues?.amount}
          required
          errors={errors?.amount}
        />
        <TextField label="Date" name="date" type="date" defaultValue={defaultValues?.date} required errors={errors?.date} />
      </div>

      <SelectField label="Category" name="categoryId" defaultValue={defaultValues?.categoryId ?? ""} errors={errors?.categoryId}>
        <option value="">Uncategorized</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label={type === "EXPENSE" ? "Merchant" : "Source"}
        name="merchant"
        defaultValue={defaultValues?.merchant}
        placeholder={type === "EXPENSE" ? "e.g. Trader Joe's" : "e.g. Acme Inc."}
        errors={errors?.merchant}
      />
      <TextField label="Description (optional)" name="description" defaultValue={defaultValues?.description} errors={errors?.description} />
      <TextAreaField label="Notes (optional)" name="notes" defaultValue={defaultValues?.notes} errors={errors?.notes} />

      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
