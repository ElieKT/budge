"use client";

import { useActionState, useEffect } from "react";
import { TextField, TextAreaField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export type SavingsGoalFormValues = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  notes: string;
};

export function SavingsGoalForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel = "Save goal",
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  defaultValues?: Partial<SavingsGoalFormValues>;
  onSuccess: () => void;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined as ActionResult | undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      <TextField label="Goal name" name="name" defaultValue={defaultValues?.name} required errors={errors?.name} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Target amount (USD)" name="targetAmount" inputMode="decimal" defaultValue={defaultValues?.targetAmount} required errors={errors?.targetAmount} />
        <TextField label="Current amount (USD)" name="currentAmount" inputMode="decimal" defaultValue={defaultValues?.currentAmount ?? "0"} errors={errors?.currentAmount} />
      </div>
      <TextField label="Target date (optional)" name="targetDate" type="date" defaultValue={defaultValues?.targetDate} errors={errors?.targetDate} />
      <TextAreaField label="Notes (optional)" name="notes" defaultValue={defaultValues?.notes} errors={errors?.notes} />
      <div className="flex justify-end pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
