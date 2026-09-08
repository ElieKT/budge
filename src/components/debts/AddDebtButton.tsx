"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DebtForm } from "./DebtForm";
import { createDebt } from "@/server/actions/debts";

export function AddDebtButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add debt</Button>
      {open && (
        <Modal title="Add a debt" onClose={() => setOpen(false)}>
          <DebtForm action={createDebt} onSuccess={() => setOpen(false)} submitLabel="Add debt" />
        </Modal>
      )}
    </>
  );
}
