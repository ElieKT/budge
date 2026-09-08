import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/server/actions/auth";

/** Protected admin shell. Middleware already redirects non-admins away from
 * /admin, but this is checked again here — never trust routing alone for
 * an authorization boundary. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const unreadMessages = await prisma.contactMessage.count({ where: { isResolved: false } });

  return (
    <div className="min-h-dvh bg-muted dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold" style={{ color: "var(--accent)" }}>
              💰 Budge <span className="text-sm font-normal text-slate-400">Admin</span>
            </span>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/admin" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Overview
              </Link>
              <Link href="/admin/users" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Users
              </Link>
              <Link href="/admin/messages" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Messages
                {unreadMessages > 0 && (
                  <span className="rounded-full bg-expense px-1.5 py-0.5 text-xs font-semibold text-white">{unreadMessages}</span>
                )}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-500 hover:underline dark:text-slate-400">
              ← Back to app
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="font-medium text-slate-500 hover:underline dark:text-slate-400">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
