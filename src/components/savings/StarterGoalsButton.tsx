"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormBanner } from "@/components/ui/Field";
import { SAVINGS_GOAL_TEMPLATES } from "@/lib/savingsTemplates";
import { formatCurrency } from "@/lib/money";
import { createStarterSavingsGoals } from "@/server/actions/savingsGoals";

export function StarterGoalsButton() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add starter goals
      </Button>
      {open && (
        <Modal title="Add starter goals" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Pick any common goals to add instantly — edit the target amount afterward if these
              defaults don&apos;t fit.
            </p>
            {error && <FormBanner message={error} />}
            <ul className="space-y-2">
              {SAVINGS_GOAL_TEMPLATES.map((t) => (
                <li key={t.name}>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(t.name)}
                        onChange={() => toggle(t.name)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {t.name}
                    </span>
                    <span className="text-slate-400">{formatCurrency(t.targetAmountCents)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                disabled={pending || selected.length === 0}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await createStarterSavingsGoals(selected);
                    if (!result.ok) return setError(result.error);
                    setOpen(false);
                    router.refresh();
                  });
                }}
              >
                {pending ? "Adding…" : `Add ${selected.length || ""} goal${selected.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
