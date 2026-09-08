import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { CONTACT } from "@/lib/contact";

export default function PrivacyPage() {
  return (
    <PublicPageShell title="Privacy Policy">
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This is a template, not reviewed by a lawyer. Have it reviewed by counsel before relying on
        it for a real launch — this page describes the app&apos;s actual current behavior, but isn&apos;t
        a substitute for proper legal drafting.
      </div>

      <p><strong>Last updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">What we collect</h2>
      <p>Account information you provide (name, email, password — stored as a salted hash, never in plain text), and the financial data you enter or choose to sync: transactions, budgets, savings goals, and, if you connect one, bank/card account and balance data via Plaid.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">What we don&apos;t collect</h2>
      <p>We never ask for or store your online-banking username or password. Bank/card connections use Plaid, which handles your bank credentials directly and gives us only a read-only token — we never see your bank login.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">How your data is isolated</h2>
      <p>Every account&apos;s financial data is scoped to that account only. There is no unrestricted administrative access to user financial records.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Third parties</h2>
      <p>We use Plaid (bank/card connections, optional), Resend (password-reset email, optional), and ExchangeRate-API (currency conversion rates — no personal data sent). We do not sell your data.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Your choices</h2>
      <p>You can export nothing automatically yet, but you can delete your account at any time from Settings, which permanently removes your data.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Contact</h2>
      <p>Questions about this policy: <a href={`mailto:${CONTACT.email}`} className="hover:underline" style={{ color: "var(--accent)" }}>{CONTACT.email}</a> or {CONTACT.phone}.</p>
    </PublicPageShell>
  );
}
