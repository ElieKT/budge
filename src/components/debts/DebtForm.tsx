"use client";

import { useActionState, useEffect } from "react";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export type DebtFormValues = { name: string; balance: string; apr: string; minPayment: string };

export function DebtForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel = "Save debt",
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  defaultValues?: Partial<DebtFormValues>;
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
      <TextField label="Debt name" name="name" placeholder="e.g. Visa card" defaultValue={defaultValues?.name} required errors={errors?.name} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Balance owed (USD)" name="balance" inputMode="decimal" defaultValue={defaultValues?.balance} required errors={errors?.balance} />
        <TextField label="APR (%)" name="apr" inputMode="decimal" placeholder="e.g. 24.99" defaultValue={defaultValues?.apr} required errors={errors?.apr} />
      </div>
      <TextField
        label="Minimum monthly payment (USD)"
        name="minPayment"
        inputMode="decimal"
        defaultValue={defaultValues?.minPayment}
        required
        errors={errors?.minPayment}
      />
      <div className="flex justify-end pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
