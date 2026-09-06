"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormBanner } from "@/components/ui/Field";
import { saveMonthlyBudget } from "@/server/actions/budgets";

type Category = { id: string; name: string };
type Allocation = { categoryId: string; amount: string };

export function BudgetEditorModal({
  year,
  month,
  categories,
  existing,
  triggerLabel = "Edit budget",
}: {
  year: number;
  month: number;
  categories: Category[];
  existing: Allocation[];
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Allocation[]>(existing.length > 0 ? existing : [{ categoryId: categories[0]?.id ?? "", amount: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function updateRow(i: number, patch: Partial<Allocation>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    const unused = categories.find((c) => !rows.some((r) => r.categoryId === c.id));
    setRows((prev) => [...prev, { categoryId: unused?.id ?? categories[0]?.id ?? "", amount: "" }]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    setError(null);
    const validRows = rows.filter((r) => r.categoryId && r.amount);
    if (validRows.length === 0) {
      setError("Add at least one category limit.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("year", String(year));
      fd.set("month", String(month));
      fd.set("allocations", JSON.stringify(validRows.map((r) => ({ categoryId: r.categoryId, amountLimit: r.amount }))));
      const result = await saveMonthlyBudget(undefined, fd);
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
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      {open && (
        <Modal title={`Budget for this month`} onClose={() => setOpen(false)}>
          <div className="space-y-4">
            {error && <FormBanner message={error} />}
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    {i === 0 && <label className="label">Category</label>}
                    <select
                      value={row.categoryId}
                      onChange={(e) => updateRow(i, { categoryId: e.target.value })}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    {i === 0 && <label className="label">Limit (USD)</label>}
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(i, { amount: e.target.value })}
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    />
                  </div>
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove category" className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-expense">
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="text-sm font-medium text-brand-600 hover:underline">
              + Add category
            </button>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save budget"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
