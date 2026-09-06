"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/server/actions/auth";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPassword, undefined as ActionResult | undefined);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <FormBanner tone="success" message="Your password has been updated." />
        <Link href="/login" className="block text-center text-sm font-medium text-brand-600 hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state && !state.ok && <FormBanner message={state.error} />}
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state && !state.ok ? state.fieldErrors?.password : undefined}
      />
      <p className="text-xs text-slate-500">At least 10 characters, with an uppercase letter, a lowercase letter, and a number.</p>
      <SubmitButton className="w-full" pendingText="Updating…">Set new password</SubmitButton>
    </form>
  );
}
