import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, Badge } from "@/components/ui/Misc";
import { MarkMessageResolvedButton } from "@/components/admin/MarkMessageResolvedButton";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Messages" description="Submissions from the Help page's contact form." />

      {messages.length === 0 ? (
        <EmptyState title="No messages yet" description="Anything submitted through the Help page's contact form shows up here." />
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {m.name} <span className="font-normal text-slate-400">&lt;{m.email}&gt;</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {m.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
                  </p>
                </div>
                {m.isResolved ? <Badge tone="income">Resolved</Badge> : <Badge tone="warning">New</Badge>}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{m.message}</p>
              <div className="mt-3 flex items-center gap-3">
                <a href={`mailto:${m.email}`} className="text-sm font-medium text-brand-600 hover:underline">
                  Reply by email
                </a>
                <MarkMessageResolvedButton id={m.id} isResolved={m.isResolved} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
