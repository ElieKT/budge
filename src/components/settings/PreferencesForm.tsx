"use client";

import { useActionState } from "react";
import { SelectField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { CURRENCIES } from "@/lib/currencies";
import { updatePreferences } from "@/server/actions/preferences";
import type { ActionResult } from "@/server/action-result";

export function PreferencesForm({ currency, monthlyIncomeEstimate }: { currency: string; monthlyIncomeEstimate: string }) {
  const [state, formAction] = useActionState(updatePreferences, undefined as ActionResult | undefined);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      {state?.ok && <FormBanner tone="success" message="Preferences updated." />}
      <SelectField label="Currency" name="currency" defaultValue={currency} errors={state && !state.ok ? state.fieldErrors?.currency : undefined}>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
        ))}
      </SelectField>
      <p className="-mt-2 text-xs text-slate-400">
        Changes how amounts are displayed going forward — it doesn&apos;t convert amounts you&apos;ve
        already entered.
      </p>
      <TextField
        label="Approximate monthly income (optional)"
        name="monthlyIncomeEstimate"
        inputMode="decimal"
        defaultValue={monthlyIncomeEstimate}
        errors={state && !state.ok ? state.fieldErrors?.monthlyIncomeEstimate : undefined}
      />
      <SubmitButton pendingText="Saving…">Save preferences</SubmitButton>
    </form>
  );
}
