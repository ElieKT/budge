import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { CONTACT } from "@/lib/contact";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is my financial data private?",
    a: "Yes. Every user's data is isolated — there is no way for one account to see another's transactions, budgets, or goals, and there is no unrestricted admin view into your financial records.",
  },
  {
    q: "Do I need to connect my bank account?",
    a: "No. Budge works fully with manually-entered transactions. Connecting a bank/card is optional and, when enabled, is read-only — Budge can never move money or make payments.",
  },
  {
    q: "Can I send money to another user, or trade stocks/crypto from the app?",
    a: "No, and this is by design, not a missing feature — both require financial licensing (money transmission and broker-dealer registration, respectively) that a budgeting app doesn't have. Investment tracking is read-only; the household ledger tracks who-owes-whom for bookkeeping only.",
  },
  {
    q: "How do I reset my password?",
    a: "Use \"Forgot password?\" on the sign-in page. You'll get a reset link by email (if email delivery is configured on this deployment) or, in a local/development setup, printed to the server console.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Danger zone → Permanently delete my account. This immediately and permanently removes your account and everything you own — transactions, budgets, goals, categories, and connected accounts.",
  },
  {
    q: "What currencies are supported?",
    a: "You can set your preferred currency in Settings, and amounts across the app are shown formatted in it. Support currently covers the currencies of English-, French-, and Spanish-speaking countries.",
  },
];

export default function HelpPage() {
  return (
    <PublicPageShell title="Help & Support">
      <section className="card">
        <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-50">Contact us</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-400">Email</dt>
            <dd>
              <a href={`mailto:${CONTACT.email}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                {CONTACT.email}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-400">Phone</dt>
            <dd>
              <a href={`tel:+1${CONTACT.phone.replace(/\D/g, "")}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                {CONTACT.phone}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-400">Address</dt>
            <dd className="font-medium text-slate-500 dark:text-slate-400">{CONTACT.address}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((item) => (
            <details key={item.q} className="card">
              <summary className="cursor-pointer font-medium text-slate-800 dark:text-slate-100">{item.q}</summary>
              <p className="mt-2 text-slate-500 dark:text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
