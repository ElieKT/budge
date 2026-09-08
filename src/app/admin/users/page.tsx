import { requireAdmin } from "@/lib/auth-guard";
import { getUserRoster } from "@/server/data/admin";
import { PageHeader, Badge } from "@/components/ui/Misc";
import { RoleToggleButton } from "@/components/admin/RoleToggleButton";

export default async function AdminUsersPage() {
  const currentUserId = await requireAdmin();
  const users = await getUserRoster();

  return (
    <div>
      <PageHeader
        title="Users"
        description="Account metadata only — name, email, role, and join date. No transactions, balances, or budgets."
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Locale</th>
              <th className="px-4 py-3 font-medium">Onboarded</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.preference?.locale ?? "EN"}</td>
                <td className="px-4 py-3">
                  {u.preference?.onboardingCompletedAt ? <Badge tone="income">Yes</Badge> : <Badge tone="neutral">No</Badge>}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {u.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === "ADMIN" ? "warning" : "neutral"}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-slate-400">You</span>
                  ) : (
                    <RoleToggleButton userId={u.id} role={u.role} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
