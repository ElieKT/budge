import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-lg font-semibold text-brand-700">💰 Budge</span>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Take control of your money, one month at a time.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
          Track income and expenses, set category budgets, and watch your savings goals grow —
          built for individuals who want a clear, private picture of their finances.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register">
            <Button size="md">Create your free account</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="md">Sign in</Button>
          </Link>
        </div>

        <dl className="mx-auto mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          {[
            { t: "Manual, private, yours", d: "You enter your own transactions — no bank credentials required, ever." },
            { t: "Budgets that keep up", d: "Category limits with clear progress bars and warnings before you overspend." },
            { t: "Goals you can see", d: "Track savings goals with real progress percentages, not guesswork." },
          ].map((f) => (
            <div key={f.t} className="card">
              <dt className="font-medium text-slate-900 dark:text-slate-50">{f.t}</dt>
              <dd className="mt-1 text-sm text-slate-500">{f.d}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
