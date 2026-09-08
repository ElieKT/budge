import { requireUserId } from "@/lib/auth-guard";
import { getAccountsForUser } from "@/server/data/accounts";
import { isPlaidConfigured } from "@/lib/plaid";
import { isLiabilityAccountType } from "@/lib/calculations";
import { formatCurrency } from "@/lib/money";
import { PageHeader, EmptyState } from "@/components/ui/Misc";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { PlaidConnectButton } from "@/components/accounts/PlaidConnectButton";
import { AccountRow } from "@/components/accounts/AccountRow";

export default async function AccountsPage() {
  const userId = await requireUserId();
  const { accounts, netWorth } = await getAccountsForUser(userId);

  const assets = accounts.filter((a) => !isLiabilityAccountType(a.type));
  const liabilities = accounts.filter((a) => isLiabilityAccountType(a.type));

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Bank accounts, cards, and net worth — read-only, nothing here can move money"
        action={<AddAccountModal />}
      />

      <div className="card mb-6">
        <p className="text-sm font-medium text-slate-500">Net worth</p>
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${netWorth >= 0 ? "text-slate-900 dark:text-slate-50" : "amount-expense"}`}>
          {formatCurrency(netWorth)}
        </p>
        <p className="mt-1 text-xs text-slate-400">Assets minus what you owe on credit cards and loans.</p>
      </div>

      <div className="mb-6">
        <PlaidConnectButton configured={isPlaidConfigured()} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 text-base font-semibold">Assets</h2>
          {assets.length === 0 ? (
            <EmptyState title="No asset accounts yet" description="Add a checking, savings, investment, or crypto account." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {assets.map((a) => (
                <AccountRow key={a.id} account={a} />
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="mb-2 text-base font-semibold">Liabilities</h2>
          {liabilities.length === 0 ? (
            <EmptyState title="No liability accounts" description="Credit cards and loans you add will show up here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {liabilities.map((a) => (
                <AccountRow key={a.id} account={a} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
