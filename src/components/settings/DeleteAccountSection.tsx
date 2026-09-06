"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAccount } from "@/server/actions/auth";

export function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-800">Delete account</h2>
      <p className="mt-1 text-sm text-red-700">
        This permanently deletes your account and every transaction, budget, category, savings
        goal, and recurring rule you own. This cannot be undone.
      </p>
      <label className="mt-4 block text-sm font-medium text-red-800" htmlFor="confirm-delete">
        Type DELETE to confirm
      </label>
      <input
        id="confirm-delete"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mt-1.5 block w-full max-w-xs rounded-lg border border-red-300 px-3 py-2 text-sm shadow-sm"
      />
      <Button
        variant="danger"
        className="mt-3"
        disabled={confirmText !== "DELETE" || pending}
        onClick={() => startTransition(() => deleteAccount())}
      >
        {pending ? "Deleting…" : "Permanently delete my account"}
      </Button>
    </div>
  );
}
