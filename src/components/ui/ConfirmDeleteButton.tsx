"use client";

import { useState, useTransition } from "react";
import { Button } from "./Button";
import type { ActionResult } from "@/server/action-result";

export function ConfirmDeleteButton({
  action,
  confirmMessage = "This can't be undone. Delete it anyway?",
  label = "Delete",
}: {
  action: () => Promise<ActionResult>;
  confirmMessage?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {pending ? "Deleting…" : label}
      </Button>
      {error && <span className="text-xs text-expense">{error}</span>}
    </div>
  );
}
