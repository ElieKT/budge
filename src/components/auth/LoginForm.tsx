"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/server/actions/auth";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

const initialState: ActionResult | undefined = undefined;

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state && !state.ok && <FormBanner message={state.error} />}
      <TextField label="Email" name="email" type="email" autoComplete="email" required errors={state && !state.ok ? state.fieldErrors?.email : undefined} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required errors={state && !state.ok ? state.fieldErrors?.password : undefined} />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
