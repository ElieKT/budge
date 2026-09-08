"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/money";
import { Badge } from "@/components/ui/Misc";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { archiveAccount, updateAccountBalance } from "@/server/actions/accounts";

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT_CARD: "Credit card",
  LOAN: "Loan",
  INVESTMENT: "Investment",
  RETIREMENT: "Retirement",
  CRYPTO: "Crypto",
  OTHER: "Other",
};

type Account = {
  id: string;
  name: string;
  type: string;
  mask: string | null;
  source: "MANUAL" | "PLAID";
  currentBalance: number;
};

export function AccountRow({ account, currency = "USD" }: { account: Account; currency?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState((account.currentBalance / 100).toFixed(2));
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const boundUpdate = updateAccountBalance.bind(null, account.id);

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {account.name} {account.mask && <span className="text-slate-400">••{account.mask}</span>}
        </p>
        <p className="text-xs text-slate-400">
          {TYPE_LABELS[account.type]} · {account.source === "PLAID" ? <Badge tone="income">Connected</Badge> : "Manual"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <input
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
            />
            <button
              type="button"
              disabled={pending}
              className="text-sm font-medium text-brand-600 hover:underline"
              onClick={() =>
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("currentBalance", value);
                  const result = await boundUpdate(undefined, fd);
                  if (result.ok) {
                    setEditing(false);
                    router.refresh();
                  }
                })
              }
            >
              Save
            </button>
          </>
        ) : (
          <>
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(account.currentBalance, currency)}</span>
            {account.source === "MANUAL" && (
              <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-brand-600 hover:underline">
                Edit
              </button>
            )}
            <ConfirmDeleteButton
              action={() => archiveAccount(account.id)}
              label="Remove"
              confirmMessage="Remove this account from your net worth tracking? Its transaction history (if any) is kept."
            />
          </>
        )}
      </div>
    </li>
  );
}
