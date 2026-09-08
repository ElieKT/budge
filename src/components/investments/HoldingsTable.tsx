import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/Misc";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteInvestmentHolding } from "@/server/actions/investments";

type Holding = {
  id: string;
  securityName: string;
  ticker: string | null;
  assetClass: string;
  quantity: unknown; // Prisma.Decimal — display only, formatted with String()
  currentValue: number;
  costBasis: number | null;
  account: { name: string };
};

export function HoldingsTable({ holdings, currency = "USD" }: { holdings: Holding[]; currency?: string }) {
  if (holdings.length === 0) {
    return <EmptyState title="No holdings yet" description="Add a stock, fund, or crypto position to track its value here." />;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Security</th>
            <th className="px-4 py-3 font-medium">Account</th>
            <th className="px-4 py-3 text-right font-medium">Quantity</th>
            <th className="px-4 py-3 text-right font-medium">Value</th>
            <th className="px-4 py-3 text-right font-medium">Gain/Loss</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {holdings.map((h) => {
            const gain = h.costBasis != null ? h.currentValue - h.costBasis : null;
            return (
              <tr key={h.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{h.securityName}</p>
                  <p className="text-xs text-slate-400">{h.ticker ?? h.assetClass}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{h.account.name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{String(h.quantity)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {formatCurrency(h.currentValue, currency)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${gain == null ? "text-slate-400" : gain >= 0 ? "amount-income" : "amount-expense"}`}>
                  {gain == null ? "—" : `${gain >= 0 ? "+" : "−"}${formatCurrency(Math.abs(gain), currency)}`}
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDeleteButton action={deleteInvestmentHolding.bind(null, h.id)} confirmMessage="Remove this holding?" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
