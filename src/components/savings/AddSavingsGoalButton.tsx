"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SavingsGoalForm } from "./SavingsGoalForm";
import { createSavingsGoal } from "@/server/actions/savingsGoals";

export function AddSavingsGoalButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New goal</Button>
      {open && (
        <Modal title="Create savings goal" onClose={() => setOpen(false)}>
          <SavingsGoalForm action={createSavingsGoal} onSuccess={() => setOpen(false)} submitLabel="Create goal" />
        </Modal>
      )}
    </>
  );
}
