import { requireUserId } from "@/lib/auth-guard";
import { getCategoriesForUser } from "@/server/data/categories";
import { PageHeader, Badge } from "@/components/ui/Misc";
import { AddCategoryButton, EditCategoryButton } from "@/components/categories/CategoryButtons";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteCategory } from "@/server/actions/categories";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await getCategoriesForUser(userId);
  const custom = categories.filter((c) => !c.isDefault);
  const defaults = categories.filter((c) => c.isDefault);

  return (
    <div>
      <PageHeader title="Categories" description="Organize your income and expenses" action={<AddCategoryButton />} />

      <section className="card mb-6">
        <h2 className="mb-3 text-base font-semibold">Your categories</h2>
        {custom.length === 0 ? (
          <p className="text-sm text-slate-500">You haven&apos;t created any custom categories yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {custom.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                  <Badge tone={c.kind === "INCOME" ? "income" : "expense"}>{c.kind === "INCOME" ? "Income" : "Expense"}</Badge>
                </span>
                <div className="flex items-center gap-3">
                  <EditCategoryButton categoryId={c.id} defaultValues={{ name: c.name, kind: c.kind, color: c.color }} />
                  <ConfirmDeleteButton
                    action={deleteCategory.bind(null, c.id)}
                    confirmMessage="Delete this category? Existing transactions will become uncategorized."
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1 text-base font-semibold">Default categories</h2>
        <p className="mb-3 text-sm text-slate-500">Built-in categories available to every account. These can&apos;t be edited or deleted.</p>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {defaults.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-1 text-sm text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
              <Badge tone={c.kind === "INCOME" ? "income" : "expense"}>{c.kind === "INCOME" ? "Income" : "Expense"}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
