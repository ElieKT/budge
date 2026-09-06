"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/server/actions/auth";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, undefined as ActionResult | undefined);

  if (state?.ok) {
    return (
      <FormBanner
        tone="success"
        message="If an account exists for that email, we've sent a link to reset the password. In local development without an email provider configured, check the server console for the link instead."
      />
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      <TextField label="Email" name="email" type="email" autoComplete="email" required errors={state && !state.ok ? state.fieldErrors?.email : undefined} />
      <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
