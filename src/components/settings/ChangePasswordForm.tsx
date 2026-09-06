"use client";

import { useActionState } from "react";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { changePassword } from "@/server/actions/auth";
import type { ActionResult } from "@/server/action-result";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, undefined as ActionResult | undefined);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      {state?.ok && <FormBanner tone="success" message="Password updated." />}
      <TextField label="Current password" name="currentPassword" type="password" autoComplete="current-password" required errors={errors?.currentPassword} />
      <TextField label="New password" name="newPassword" type="password" autoComplete="new-password" required errors={errors?.newPassword} />
      <p className="text-xs text-slate-500">At least 10 characters, with an uppercase letter, a lowercase letter, and a number.</p>
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
