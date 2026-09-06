"use client";

import { useActionState, useEffect } from "react";
import { SelectField, TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export type CategoryFormValues = { name: string; kind: "INCOME" | "EXPENSE"; color: string };

export function CategoryForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel = "Save category",
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  defaultValues?: Partial<CategoryFormValues>;
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
      <TextField label="Name" name="name" defaultValue={defaultValues?.name} required errors={errors?.name} />
      <SelectField label="Type" name="kind" defaultValue={defaultValues?.kind ?? "EXPENSE"} errors={errors?.kind}>
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
      </SelectField>
      <div>
        <label className="label" htmlFor="color">Color</label>
        <input id="color" name="color" type="color" defaultValue={defaultValues?.color ?? "#6b7280"} className="h-10 w-16 rounded-lg border border-slate-300" />
      </div>
      <div className="flex justify-end pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
