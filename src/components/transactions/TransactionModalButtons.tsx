"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm, type CategoryOption, type TransactionFormValues } from "./TransactionForm";
import { createTransaction, updateTransaction } from "@/server/actions/transactions";

export function AddTransactionButton({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add transaction</Button>
      {open && (
        <Modal title="Add transaction" onClose={() => setOpen(false)}>
          <TransactionForm action={createTransaction} categories={categories} onSuccess={() => setOpen(false)} submitLabel="Add transaction" />
        </Modal>
      )}
    </>
  );
}

export function EditTransactionButton({
  transactionId,
  categories,
  defaultValues,
}: {
  transactionId: string;
  categories: CategoryOption[];
  defaultValues: TransactionFormValues;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateTransaction.bind(null, transactionId);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand-600 hover:underline">
        Edit
      </button>
      {open && (
        <Modal title="Edit transaction" onClose={() => setOpen(false)}>
          <TransactionForm
            action={boundAction}
            categories={categories}
            defaultValues={defaultValues}
            onSuccess={() => setOpen(false)}
            submitLabel="Save changes"
          />
        </Modal>
      )}
    </>
  );
}
