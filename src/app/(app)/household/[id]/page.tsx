import { requireUserId } from "@/lib/auth-guard";
import { getHouseholdDetail } from "@/server/data/household";
import { formatCurrency } from "@/lib/money";
import { PageHeader, EmptyState, Badge } from "@/components/ui/Misc";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { AddMemberForm } from "@/components/household/AddMemberForm";
import { LeaveHouseholdButton } from "@/components/household/LeaveHouseholdButton";
import { SharedExpenseModal } from "@/components/household/SharedExpenseModal";
import { removeHouseholdMember, deleteSharedExpense } from "@/server/actions/household";
import { getUserCurrency } from "@/server/data/preferences";

export default async function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const [{ household, memberBalances }, currency] = await Promise.all([
    getHouseholdDetail(id, userId),
    getUserCurrency(userId),
  ]);

  const members = household.members.map((m) => ({ userId: m.userId, name: m.user.name ?? m.user.email }));
  const currentUserIsOwner = household.members.find((m) => m.userId === userId)?.role === "OWNER";
  const isSoleMember = household.members.length === 1;

  return (
    <div>
      <PageHeader
        title={household.name}
        description="Shared expense ledger — settling up still happens outside the app"
        action={<SharedExpenseModal householdId={household.id} members={members} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <h2 className="mb-3 text-base font-semibold">Balances</h2>
          <ul className="space-y-2">
            {memberBalances.map((b) => (
              <li key={b.userId} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{b.name}</span>
                <span className={`font-semibold tabular-nums ${b.balance > 0 ? "amount-income" : b.balance < 0 ? "amount-expense" : "text-slate-400"}`}>
                  {b.balance === 0 ? "settled up" : `${b.balance > 0 ? "+" : "−"}${formatCurrency(Math.abs(b.balance), currency)}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Positive = owed to them. Negative = they owe the group.</p>

          <hr className="my-4 border-slate-100" />

          <h3 className="mb-2 text-sm font-semibold text-slate-700">Members</h3>
          <ul className="mb-3 space-y-1.5">
            {household.members.map((m) => {
              const isSelf = m.userId === userId;
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
                    {m.user.name ?? m.user.email} {m.role === "OWNER" && <Badge tone="neutral">Owner</Badge>}
                  </span>
                  {isSelf ? (
                    <LeaveHouseholdButton householdId={household.id} userId={userId} isSoleMember={isSoleMember} />
                  ) : (
                    currentUserIsOwner && (
                      <ConfirmDeleteButton
                        action={removeHouseholdMember.bind(null, household.id, m.userId)}
                        label="Remove"
                        confirmMessage={`Remove ${m.user.name ?? m.user.email} from the household?`}
                      />
                    )
                  )}
                </li>
              );
            })}
          </ul>
          <AddMemberForm householdId={household.id} />
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold">Shared expenses</h2>
          {household.expenses.length === 0 ? (
            <EmptyState title="No shared expenses yet" description="Add one to start tracking who paid what." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {household.expenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{e.description}</p>
                    <p className="text-xs text-slate-400">
                      Paid by {e.paidBy.name ?? e.paidBy.email} ·{" "}
                      {e.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(e.amount, currency)}</span>
                    <ConfirmDeleteButton
                      action={deleteSharedExpense.bind(null, household.id, e.id)}
                      confirmMessage="Delete this shared expense?"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
