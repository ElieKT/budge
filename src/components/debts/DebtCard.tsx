"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/money";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DebtForm } from "./DebtForm";
import { deleteDebt, updateDebt } from "@/server/actions/debts";

type Debt = { id: string; name: string; balance: number; apr: number; minPayment: number };

export function DebtCard({ debt, currency = "USD" }: { debt: Debt; currency?: string }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-semibold text-slate-800 dark:text-slate-100">{debt.name}</h3>
        <span className="shrink-0 text-xs font-medium text-slate-400">{debt.apr.toFixed(2)}% APR</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(debt.balance, currency)}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {formatCurrency(debt.minPayment, currency)}/mo minimum
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-brand-600 hover:underline">
          Edit
        </button>
        <ConfirmDeleteButton action={() => deleteDebt(debt.id)} confirmMessage="Delete this debt? This can't be undone." />
      </div>

      {editing && (
        <Modal title="Edit debt" onClose={() => setEditing(false)}>
          <DebtForm
            action={updateDebt.bind(null, debt.id)}
            defaultValues={{
              name: debt.name,
              balance: (debt.balance / 100).toFixed(2),
              apr: String(debt.apr),
              minPayment: (debt.minPayment / 100).toFixed(2),
            }}
            onSuccess={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </Modal>
      )}
    </div>
  );
}
