"use client";

import { useActionState } from "react";
import { SelectField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { convertCurrency } from "@/server/actions/tools";
import type { ActionResult } from "@/server/action-result";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "MXN", "JPY", "AUD", "CHF", "CNY", "INR", "BRL"];

export function CurrencyConverter() {
  const [state, formAction] = useActionState(
    convertCurrency,
    undefined as ActionResult<{ result: number; rate: number; date: string }> | undefined,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="Amount"
          name="amount"
          inputMode="decimal"
          defaultValue="100"
          className="col-span-1"
          errors={state && !state.ok ? state.fieldErrors?.amount : undefined}
        />
        <SelectField label="From" name="from" defaultValue="USD" className="col-span-1">
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
        <SelectField label="To" name="to" defaultValue="EUR" className="col-span-1">
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>
      </div>
      <SubmitButton pendingText="Converting…">Convert</SubmitButton>

      {state?.ok && (
        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <p className="text-2xl font-semibold tabular-nums">{state.data.result.toLocaleString()}</p>
          {state.data.date && <p className="text-xs text-slate-400">1 unit = {state.data.rate} · rates as of {state.data.date} (ECB via frankfurter.dev)</p>}
        </div>
      )}
    </form>
  );
}
