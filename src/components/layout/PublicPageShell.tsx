import Link from "next/link";

/** Shared chrome for standalone public pages (Help, Privacy, Terms) — reachable whether signed in or not. */
export function PublicPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white dark:bg-slate-950">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link
          href="/"
          className="bg-gradient-to-r from-brand-400 to-teal-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent"
        >
          💰 Budge
        </Link>
        <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:underline dark:text-slate-400">
          Go to app →
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="mb-6 text-2xl dark:text-slate-50">{title}</h1>
        <div className="prose-sm space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div>
      </main>
    </div>
  );
}
