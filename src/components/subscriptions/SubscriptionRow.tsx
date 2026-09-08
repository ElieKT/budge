"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/money";
import { Badge } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { markSubscriptionReviewed } from "@/server/actions/subscriptions";
import type { RecurrenceFrequency } from "@/lib/subscriptions";

type Item = {
  rule: {
    id: string;
    description: string | null;
    merchant: string | null;
    amount: number;
    frequency: RecurrenceFrequency;
    category: { name: string } | null;
  };
  monthlyCents: number;
  annualCents: number;
  needsReview: boolean;
};

const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Yearly",
};

export function SubscriptionRow({ item, currency }: { item: Item; currency: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { rule } = item;
  const name = rule.merchant || rule.description || "Untitled";

  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800 dark:text-slate-100">{name}</p>
        {rule.category && <span className="text-xs text-slate-400">{rule.category.name}</span>}
      </td>
      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{FREQUENCY_LABEL[rule.frequency]}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(rule.amount, currency)}</td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(item.monthlyCents, currency)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(item.annualCents, currency)}</td>
      <td className="px-4 py-3">{item.needsReview && <Badge tone="warning">Still using this?</Badge>}</td>
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markSubscriptionReviewed(rule.id);
              router.refresh();
            })
          }
        >
          {pending ? "Saving…" : "Reviewed"}
        </Button>
      </td>
    </tr>
  );
}
