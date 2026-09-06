"use client";

import { useActionState, useEffect } from "react";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export function UpdateProgressForm({
  action,
  currentAmount,
  onSuccess,
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  currentAmount: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(action, undefined as ActionResult | undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      <TextField
        label="Current saved amount (USD)"
        name="currentAmount"
        inputMode="decimal"
        defaultValue={currentAmount}
        required
        errors={state && !state.ok ? state.fieldErrors?.currentAmount : undefined}
      />
      <div className="flex justify-end pt-2">
        <SubmitButton>Update</SubmitButton>
      </div>
    </form>
  );
}
