"use client";

import { useActionState } from "react";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { addHouseholdMember } from "@/server/actions/household";
import type { ActionResult } from "@/server/action-result";

export function AddMemberForm({ householdId }: { householdId: string }) {
  const boundAction = addHouseholdMember.bind(null, householdId);
  const [state, formAction] = useActionState(boundAction, undefined as ActionResult | undefined);

  return (
    <form action={formAction} className="space-y-3" noValidate>
      {state && !state.ok && <FormBanner message={state.error} />}
      <div className="flex items-end gap-2">
        <TextField
          label="Invite by email"
          name="email"
          type="email"
          placeholder="them@example.com"
          required
          className="flex-1"
          errors={state && !state.ok ? state.fieldErrors?.email : undefined}
        />
        <SubmitButton variant="secondary" pendingText="Adding…">Add</SubmitButton>
      </div>
      <p className="text-xs text-slate-400">They must already have a Budge account.</p>
    </form>
  );
}
