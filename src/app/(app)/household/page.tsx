import Link from "next/link";
import { requireUserId } from "@/lib/auth-guard";
import { getHouseholdsForUser } from "@/server/data/household";
import { PageHeader, EmptyState } from "@/components/ui/Misc";
import { CreateHouseholdModal } from "@/components/household/CreateHouseholdModal";

export default async function HouseholdListPage() {
  const userId = await requireUserId();
  const households = await getHouseholdsForUser(userId);

  return (
    <div>
      <PageHeader
        title="Household"
        description="Track shared expenses and who owes whom — no real money moves through this"
        action={<CreateHouseholdModal />}
      />
      {households.length === 0 ? (
        <EmptyState title="No households yet" description="Create one to start splitting shared expenses with roommates, a partner, or family." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {households.map((h) => (
            <li key={h.id}>
              <Link href={`/household/${h.id}`} className="card block hover:border-brand-300">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{h.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {h.members.length} member{h.members.length === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
