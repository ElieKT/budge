"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginAction } from "@/server/actions/auth";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/server/action-result";

async function registerThenSignIn(_prev: ActionResult | undefined, formData: FormData) {
  const result = await registerUser(_prev, formData);
  if (!result.ok) return result;
  // Registration succeeded — sign the user straight in so they land in
  // onboarding instead of having to log in a second time.
  return loginAction(_prev, formData);
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(registerThenSignIn, undefined as ActionResult | undefined);

  useEffect(() => {
    if (state?.ok) router.push("/dashboard");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value="/dashboard" />
      {state && !state.ok && <FormBanner message={state.error} />}
      <TextField label="Full name" name="name" autoComplete="name" required errors={state && !state.ok ? state.fieldErrors?.name : undefined} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required errors={state && !state.ok ? state.fieldErrors?.email : undefined} />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state && !state.ok ? state.fieldErrors?.password : undefined}
      />
      <p className="text-xs text-slate-500">At least 10 characters, with an uppercase letter, a lowercase letter, and a number.</p>
      <SubmitButton className="w-full" pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
