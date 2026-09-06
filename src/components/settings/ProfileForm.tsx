"use client";

import { useActionState } from "react";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateProfile } from "@/server/actions/auth";
import type { ActionResult } from "@/server/action-result";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState(updateProfile, undefined as ActionResult | undefined);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      {state?.ok && <FormBanner tone="success" message="Profile updated." />}
      <TextField label="Full name" name="name" defaultValue={name} required errors={state && !state.ok ? state.fieldErrors?.name : undefined} />
      <TextField label="Email" name="email" value={email} disabled className="opacity-70" />
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
