"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField, FormBanner } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createInvestmentHolding } from "@/server/actions/investments";
import type { ActionResult } from "@/server/action-result";

type Account = { id: string; name: string };

export function AddHoldingModal({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createInvestmentHolding, undefined as ActionResult | undefined);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={accounts.length === 0}>
        + Add holding
      </Button>
      {open && (
        <Modal title="Add an investment holding" onClose={() => setOpen(false)}>
          {accounts.length === 0 ? (
            <EmptyState
              title="Add an investment account first"
              description='Go to Accounts and add one with type "Investment", "Retirement", or "Crypto".'
            />
          ) : (
            <form action={formAction} className="space-y-4" noValidate>
              {state && !state.ok && <FormBanner message={state.error} />}
              <SelectField label="Account" name="accountId" defaultValue={accounts[0]?.id} errors={errors?.accountId}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </SelectField>
              <TextField label="Security name" name="securityName" placeholder="e.g. Apple Inc. or Bitcoin" required errors={errors?.securityName} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Ticker (optional)" name="ticker" placeholder="AAPL / BTC" errors={errors?.ticker} />
                <SelectField label="Asset class" name="assetClass" defaultValue="EQUITY" errors={errors?.assetClass}>
                  <option value="EQUITY">Equity (stock)</option>
                  <option value="ETF">ETF</option>
                  <option value="MUTUAL_FUND">Mutual fund</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="BOND">Bond</option>
                  <option value="OTHER">Other</option>
                </SelectField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Quantity" name="quantity" placeholder="e.g. 12.5" required errors={errors?.quantity} />
                <TextField label="Current value (USD)" name="currentValue" inputMode="decimal" placeholder="0.00" required errors={errors?.currentValue} />
              </div>
              <TextField label="Cost basis (optional, USD)" name="costBasis" inputMode="decimal" errors={errors?.costBasis} />
              <p className="text-xs text-slate-400">
                Entered manually — this app never places a trade. Update the value yourself as it changes.
              </p>
              <div className="flex justify-end pt-2">
                <SubmitButton>Add holding</SubmitButton>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
