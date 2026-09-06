"use client";

import { useActionState } from "react";
import { SelectField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updatePreferences } from "@/server/actions/preferences";
import type { ActionResult } from "@/server/action-result";

export function PreferencesForm({ currency, monthlyIncomeEstimate }: { currency: string; monthlyIncomeEstimate: string }) {
  const [state, formAction] = useActionState(updatePreferences, undefined as ActionResult | undefined);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      {state?.ok && <FormBanner tone="success" message="Preferences updated." />}
      <SelectField label="Currency" name="currency" defaultValue={currency}>
        <option value="USD">$ USD — US Dollar</option>
      </SelectField>
      <p className="-mt-2 text-xs text-slate-400">Additional currencies are planned for a future release.</p>
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
