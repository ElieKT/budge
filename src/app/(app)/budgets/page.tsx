import { requireUserId } from "@/lib/auth-guard";
import { getCategoriesForUser } from "@/server/data/categories";
import { getMonthlyBudget } from "@/server/data/budgets";
import { formatCurrency } from "@/lib/money";
import { PageHeader, ProgressBar, Badge, EmptyState } from "@/components/ui/Misc";
import { MonthNav } from "@/components/budgets/MonthNav";
import { BudgetEditorModal } from "@/components/budgets/BudgetEditorModal";
import { CopyBudgetButton } from "@/components/budgets/CopyBudgetButton";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteMonthlyBudget } from "@/server/actions/budgets";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const [expenseCategories, budget] = await Promise.all([
    getCategoriesForUser(userId, "EXPENSE"),
    getMonthlyBudget(userId, year, month),
  ]);

  const categoryOptions = expenseCategories.map((c) => ({ id: c.id, name: c.name }));
  const existingAllocations = budget.categories.map((c) => ({ categoryId: c.categoryId, amount: (c.limit / 100).toFixed(2) }));

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits by category"
        action={<BudgetEditorModal year={year} month={month} categories={categoryOptions} existing={existingAllocations} triggerLabel={budget.budgetId ? "Edit budget" : "Create budget"} />}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <MonthNav year={year} month={month} />
        <div className="flex items-center gap-2">
          {!budget.budgetId && <CopyBudgetButton year={year} month={month} />}
          {budget.budgetId && (
            <ConfirmDeleteButton
              action={() => deleteMonthlyBudget(budget.budgetId as string)}
              label="Delete budget"
              confirmMessage="Delete this month's entire budget? This can't be undone."
            />
          )}
        </div>
      </div>

      {budget.categories.length === 0 ? (
        <EmptyState title="No budget for this month" description="Create category limits to start tracking your spending against a plan, or copy last month's." />
      ) : (
        <>
          <div className="card mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total planned</span>
            <span className="font-semibold tabular-nums">{formatCurrency(budget.totalLimit)}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {budget.categories.map((c) => (
              <div key={c.id} className="card">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                  {c.status === "over" && <Badge tone="expense">Over budget</Badge>}
                  {c.status === "warning" && <Badge tone="warning">Almost there</Badge>}
                </div>
                <ProgressBar percentage={c.percentage} status={c.status} />
                <div className="mt-2 flex justify-between text-sm text-slate-500">
                  <span>{formatCurrency(c.spent)} spent</span>
                  <span>{c.remaining >= 0 ? `${formatCurrency(c.remaining)} left` : `${formatCurrency(-c.remaining)} over`}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
