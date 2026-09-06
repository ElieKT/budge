import { clsx } from "clsx";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "income" | "expense" | "neutral" | "warning";
}) {
  const toneClasses = {
    income: "bg-brand-50 text-brand-700",
    expense: "bg-red-50 text-red-700",
    neutral: "bg-slate-100 text-slate-600",
    warning: "bg-amber-50 text-amber-700",
  }[tone];
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClasses)}>
      {children}
    </span>
  );
}

export function ProgressBar({ percentage, status = "under" }: { percentage: number; status?: "under" | "warning" | "over" }) {
  // Fixed status colors (good/warning/critical) — never reused for series identity.
  const barColor = { under: "bg-[#0ca30c]", warning: "bg-[#fab219]", over: "bg-[#d03b3b]" }[status];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
