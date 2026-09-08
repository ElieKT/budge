import { requireUserId } from "@/lib/auth-guard";
import { getInvestmentAccountsForUser, getInvestmentHoldingsForUser } from "@/server/data/investments";
import { formatCurrency } from "@/lib/money";
import { PageHeader } from "@/components/ui/Misc";
import { AddHoldingModal } from "@/components/investments/AddHoldingModal";
import { HoldingsTable } from "@/components/investments/HoldingsTable";
import { getUserCurrency } from "@/server/data/preferences";

export default async function InvestmentsPage() {
  const userId = await requireUserId();
  const [{ holdings, totalValue, totalCostBasis }, accounts, currency] = await Promise.all([
    getInvestmentHoldingsForUser(userId),
    getInvestmentAccountsForUser(userId),
    getUserCurrency(userId),
  ]);

  const totalGain = totalCostBasis > 0 ? totalValue - totalCostBasis : null;

  return (
    <div>
      <PageHeader
        title="Investments"
        description="Read-only portfolio tracking — this app never places a trade"
        action={<AddHoldingModal accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Total portfolio value</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalValue, currency)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Unrealized gain/loss</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${totalGain == null ? "text-slate-400" : totalGain >= 0 ? "amount-income" : "amount-expense"}`}>
            {totalGain == null ? "—" : formatCurrency(totalGain, currency)}
          </p>
          {totalGain == null && <p className="mt-1 text-xs text-slate-400">Add a cost basis to holdings to see this.</p>}
        </div>
      </div>

      <HoldingsTable holdings={holdings} currency={currency} />
    </div>
  );
}
