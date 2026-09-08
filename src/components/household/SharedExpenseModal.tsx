"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField, FormBanner } from "@/components/ui/Field";
import { createSharedExpense } from "@/server/actions/household";

type Member = { userId: string; name: string };

export function SharedExpenseModal({ householdId, members }: { householdId: string; members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const boundAction = createSharedExpense.bind(null, householdId);

  function splitEvenly() {
    const total = Number(amount || "0");
    if (!total || members.length === 0) return;
    const each = Math.floor((total / members.length) * 100) / 100;
    const next: Record<string, string> = {};
    members.forEach((m, i) => {
      // give any leftover cent to the last person so it still sums exactly
      const isLast = i === members.length - 1;
      const value = isLast ? (total - each * (members.length - 1)) : each;
      next[m.userId] = value.toFixed(2);
    });
    setSplits(next);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("description", description);
      fd.set("amount", amount);
      fd.set("date", date);
      fd.set(
        "splits",
        JSON.stringify(
          members.filter((m) => splits[m.userId]).map((m) => ({ userId: m.userId, shareAmount: splits[m.userId] })),
        ),
      );
      const result = await boundAction(undefined, fd);
      if (!result.ok) return setError(result.error);
      setOpen(false);
      setDescription("");
      setAmount("");
      setSplits({});
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add shared expense</Button>
      {open && (
        <Modal title="Add a shared expense" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            {error && <FormBanner message={error} />}
            <TextField label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Total amount (USD)" name="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <TextField label="Date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label mb-0">Split</span>
                <button type="button" onClick={splitEvenly} className="text-sm font-medium text-brand-600 hover:underline">
                  Split evenly
                </button>
              </div>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm text-slate-600 dark:text-slate-300">{m.name}</span>
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={splits[m.userId] ?? ""}
                      onChange={(e) => setSplits((prev) => ({ ...prev, [m.userId]: e.target.value }))}
                      className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">Shares must add up to the total amount.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button onClick={submit} disabled={pending || !description || !amount}>
                {pending ? "Adding…" : "Add expense"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
