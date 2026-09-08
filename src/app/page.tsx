import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/lib/contact";

const FEATURES = [
  { icon: "🔒", t: "Manual, private, yours", d: "Enter your own transactions — no bank credentials required, ever. Your data is never shared or sold." },
  { icon: "🎯", t: "Budgets that keep up", d: "Category limits with clear progress bars and warnings before you overspend, not after." },
  { icon: "🏦", t: "Net worth, at a glance", d: "Track checking, savings, cards, and loans — manually, or synced read-only via Plaid." },
  { icon: "📈", t: "Investments, tracked honestly", d: "See your portfolio's value and gain/loss. Read-only, always — this app never places a trade." },
  { icon: "🏠", t: "Split expenses with your household", d: "A shared ledger for roommates, partners, or family — tracks who owes whom, no payment processing involved." },
  { icon: "🌍", t: "Built for real life", d: "Dark mode, a custom accent color, and support for English, French, and Spanish." },
];

const STEPS = [
  { n: "1", t: "Create your free account", d: "Takes under a minute. No credit card, no bank login." },
  { n: "2", t: "Add your income and expenses", d: "Or connect accounts read-only for automatic syncing." },
  { n: "3", t: "Set budgets and goals", d: "Watch your progress update in real time as you go." },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white dark:bg-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-2xl font-semibold" style={{ color: "var(--accent)" }}>💰 Budge</span>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started free</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            🔐 Your data, isolated and private
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
            Take control of your money,{" "}
            <span style={{ color: "var(--accent)" }}>one month at a time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            Budgets, savings goals, net worth, and investment tracking — in one clear, honest app
            built for people who want to actually see where their money goes, not another
            spreadsheet.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="md">Create your free account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="md">Sign in</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">Free to use. No credit card required.</p>
        </section>

        {/* Features */}
        <section className="border-y border-slate-100 bg-muted py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Everything you need, nothing you don&apos;t
            </h2>
            <dl className="mx-auto mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.t} className="card">
                  <span className="text-2xl">{f.icon}</span>
                  <dt className="mt-3 font-medium text-slate-900 dark:text-slate-50">{f.t}</dt>
                  <dd className="mt-1 text-sm text-slate-500 dark:text-slate-400">{f.d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-50">Get started in minutes</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {s.n}
                </div>
                <h3 className="mt-3 font-medium text-slate-900 dark:text-slate-50">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/register">
              <Button size="md">Start budgeting for free</Button>
            </Link>
          </div>
        </section>

        {/* Trust */}
        <section className="border-t border-slate-100 py-10 dark:border-slate-800">
          <div className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              We never ask for your online-banking username or password, and every account&apos;s
              financial data is completely isolated from every other account.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-muted dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <span className="text-lg font-semibold" style={{ color: "var(--accent)" }}>💰 Budge</span>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Personal budgeting, done honestly.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Company</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                <li><Link href="/help" className="hover:underline">Help &amp; Support</Link></li>
                <li><Link href="/security" className="hover:underline">Security &amp; Privacy Practices</Link></li>
                <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
                <li><Link href="/changelog" className="hover:underline">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Contact us</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                <li><a href={`mailto:${CONTACT.email}`} className="hover:underline">{CONTACT.email}</a></li>
                <li><a href={`tel:+1${CONTACT.phone.replace(/\D/g, "")}`} className="hover:underline">{CONTACT.phone}</a></li>
                <li>{CONTACT.address}</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800">
            © {new Date().getFullYear()} Budge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
