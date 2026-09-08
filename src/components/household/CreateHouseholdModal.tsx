"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField, FormBanner } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createHousehold } from "@/server/actions/household";
import type { ActionResult } from "@/server/action-result";

export function CreateHouseholdModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createHousehold, undefined as ActionResult | undefined);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New household</Button>
      {open && (
        <Modal title="Create a household" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4" noValidate>
            {state && !state.ok && <FormBanner message={state.error} />}
            <TextField label="Name" name="name" placeholder="e.g. Apt 4B, The Smiths" required errors={state && !state.ok ? state.fieldErrors?.name : undefined} />
            <p className="text-xs text-slate-400">
              You can invite other Budge users by email afterward. No money moves through this — it&apos;s just a
              shared ledger for who paid what.
            </p>
            <div className="flex justify-end pt-2">
              <SubmitButton>Create</SubmitButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
