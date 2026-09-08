"use client";

import { useActionState, useEffect, useState } from "react";
import { TextField, TextAreaField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { submitContactMessage } from "@/server/actions/contact";
import type { ActionResult } from "@/server/action-result";

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactMessage, undefined as ActionResult | undefined);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (state?.ok) setSubmitted(true);
  }, [state]);

  if (submitted) {
    return (
      <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300" role="status">
        Thanks — your message has been sent. We&apos;ll get back to you at the email you provided.
      </div>
    );
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Your name" name="name" required errors={errors?.name} />
        <TextField label="Your email" name="email" type="email" required errors={errors?.email} />
      </div>
      {/* Honeypot: hidden from real visitors via CSS (not just visually
          via markup order), so a filled-in value is almost always a bot. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />
      <TextAreaField label="Message" name="message" required errors={errors?.message} />
      <div className="flex justify-end">
        <SubmitButton>Send message</SubmitButton>
      </div>
    </form>
  );
}
