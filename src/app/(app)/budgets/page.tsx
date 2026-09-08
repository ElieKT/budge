import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getCategoriesForUser } from "@/server/data/categories";
import { getMonthlyBudget } from "@/server/data/budgets";
import { formatCurrency } from "@/lib/money";
import { PageHeader, ProgressBar, Badge, EmptyState } from "@/components/ui/Misc";
import { MonthNav } from "@/components/budgets/MonthNav";
import { BudgetEditorModal } from "@/components/budgets/BudgetEditorModal";
import { BudgetTemplateModal } from "@/components/budgets/BudgetTemplateModal";
import { CopyBudgetButton } from "@/components/budgets/CopyBudgetButton";
import { AddTransactionButton } from "@/components/transactions/TransactionModalButtons";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteMonthlyBudget } from "@/server/actions/budgets";
import { getUserCurrency } from "@/server/data/preferences";

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

  const [expenseCategories, allCategories, budget, currency, preference] = await Promise.all([
    getCategoriesForUser(userId, "EXPENSE"),
    getCategoriesForUser(userId),
    getMonthlyBudget(userId, year, month),
    getUserCurrency(userId),
    prisma.userPreference.findUnique({ where: { userId } }),
  ]);

  const categoryOptions = expenseCategories.map((c) => ({ id: c.id, name: c.name }));
  const existingAllocations = budget.categories.map((c) => ({ categoryId: c.categoryId, amount: (c.limit / 100).toFixed(2) }));
  const defaultMonthlyIncome = preference?.monthlyIncomeEstimate ? (preference.monthlyIncomeEstimate / 100).toFixed(2) : "";

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits by category"
        action={
          <div className="flex flex-wrap gap-2">
            <AddTransactionButton categories={allCategories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))} />
            <BudgetTemplateModal year={year} month={month} defaultMonthlyIncome={defaultMonthlyIncome} />
            <BudgetEditorModal year={year} month={month} categories={categoryOptions} existing={existingAllocations} triggerLabel={budget.budgetId ? "Edit budget" : "Create budget"} />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <MonthNav year={year} month={month} />
        <div className="flex flex-wrap items-center gap-2">
          {!budget.budgetId && <CopyBudgetButton year={year} month={month} />}
          {budget.budgetId && (
            <ConfirmDeleteButton
              action={deleteMonthlyBudget.bind(null, budget.budgetId as string)}
              label="Delete budget"
              confirmMessage="Delete this month's entire budget? This can't be undone."
            />
          )}
        </div>
      </div>

      {budget.categories.length === 0 ? (
        <EmptyState title="No budget for this month" description="Create category limits to start tracking your spending against a plan, use a template, or copy last month's." />
      ) : (
        <>
          <div className="card mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total planned</span>
            <span className="font-semibold tabular-nums">{formatCurrency(budget.totalLimit, currency)}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {budget.categories.map((c) => (
              <div key={c.id} className="card">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                  {c.status === "over" && <Badge tone="expense">Over budget</Badge>}
                  {c.status === "warning" && <Badge tone="warning">Almost there</Badge>}
                </div>
                <ProgressBar percentage={c.percentage} status={c.status} />
                <div className="mt-2 flex flex-wrap justify-between gap-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{formatCurrency(c.spent, currency)} spent</span>
                  <span>{c.remaining >= 0 ? `${formatCurrency(c.remaining, currency)} left` : `${formatCurrency(-c.remaining, currency)} over`}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
