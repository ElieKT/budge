"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createManualAccount } from "@/server/actions/accounts";
import type { ActionResult } from "@/server/action-result";

const ACCOUNT_TYPES = [
  { value: "CHECKING", label: "Checking" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "LOAN", label: "Loan" },
  { value: "INVESTMENT", label: "Investment / brokerage" },
  { value: "RETIREMENT", label: "Retirement (401k, IRA, etc.)" },
  { value: "CRYPTO", label: "Crypto wallet / exchange" },
  { value: "OTHER", label: "Other" },
];

export function AddAccountModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createManualAccount, undefined as ActionResult | undefined);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add account</Button>
      {open && (
        <Modal title="Add a financial account" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4" noValidate>
            {state && !state.ok && <FormBanner message={state.error} />}
            <p className="text-sm text-slate-500">
              Entered manually — update the balance yourself whenever it changes. This is a
              read-only record for your own tracking; nothing here connects to your real bank.
            </p>
            <TextField label="Name" name="name" placeholder="e.g. Chase Checking" required errors={errors?.name} />
            <SelectField label="Type" name="type" defaultValue="CHECKING" errors={errors?.type}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </SelectField>
            <TextField
              label="Current balance (USD)"
              name="currentBalance"
              inputMode="decimal"
              placeholder="0.00"
              required
              errors={errors?.currentBalance}
            />
            <p className="text-xs text-slate-400">
              For a credit card or loan, enter what you owe as a positive number — it&apos;s subtracted
              from your net worth automatically.
            </p>
            <div className="flex justify-end pt-2">
              <SubmitButton>Add account</SubmitButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
