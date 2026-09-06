"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RecurringForm } from "./RecurringForm";
import { createRecurringTransaction } from "@/server/actions/recurring";
import type { CategoryOption } from "@/components/transactions/TransactionForm";

export function AddRecurringButton({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New recurring transaction</Button>
      {open && (
        <Modal title="New recurring transaction" onClose={() => setOpen(false)}>
          <RecurringForm action={createRecurringTransaction} categories={categories} onSuccess={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
