"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { copyBudgetFromMonth } from "@/server/actions/budgets";

export function CopyBudgetButton({ year, month }: { year: number; month: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const fd = new FormData();
            fd.set("fromMonth", String(prevMonth));
            fd.set("fromYear", String(prevYear));
            fd.set("toMonth", String(month));
            fd.set("toYear", String(year));
            const result = await copyBudgetFromMonth(undefined, fd);
            if (!result.ok) setError(result.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Copying…" : "Copy last month's budget"}
      </Button>
      {error && <span className="text-sm text-expense">{error}</span>}
    </div>
  );
}
