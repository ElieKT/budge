"use client";

import { useActionState } from "react";
import { SelectField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LOCALE_LABELS } from "@/lib/i18n";
import { updateLocale } from "@/server/actions/appearance";
import type { ActionResult } from "@/server/action-result";

export function LocaleForm({ locale }: { locale: string }) {
  const [state, formAction] = useActionState(updateLocale, undefined as ActionResult | undefined);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      {state?.ok && <FormBanner tone="success" message="Language updated." />}
      <SelectField label="Language" name="locale" defaultValue={locale}>
        {Object.entries(LOCALE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </SelectField>
      <p className="-mt-2 text-xs text-slate-400">
        Translates navigation and headings. Most form and settings text is still English-only in
        this release.
      </p>
      <SubmitButton pendingText="Saving…">Save language</SubmitButton>
    </form>
  );
}
