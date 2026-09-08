import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { CONTACT } from "@/lib/contact";

export default function TermsPage() {
  return (
    <PublicPageShell title="Terms of Service">
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This is a template, not reviewed by a lawyer. Have it reviewed by counsel before relying on
        it for a real launch.
      </div>

      <p><strong>Last updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">What Budge is</h2>
      <p>Budge is a personal budgeting tool for tracking income, expenses, budgets, savings goals, and (optionally) linked account balances. It is a record-keeping and visibility tool.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">What Budge is not</h2>
      <p>Budge does not move money between accounts or people, does not execute trades of any kind, and does not provide tax, investment, or legal advice. Nothing in the app should be relied on as financial advice.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Your account</h2>
      <p>You&apos;re responsible for keeping your password confidential and for the accuracy of the data you enter. You may delete your account at any time from Settings.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Acceptable use</h2>
      <p>Don&apos;t use Budge to store or process data you don&apos;t have the right to, or to attempt to access another user&apos;s account or data.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">No warranty</h2>
      <p>Budge is provided &quot;as is.&quot; We work to keep calculations accurate, but you&apos;re responsible for verifying figures that matter to you — always double-check anything financially significant.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${CONTACT.email}`} className="hover:underline" style={{ color: "var(--accent)" }}>{CONTACT.email}</a> or {CONTACT.phone}.</p>
    </PublicPageShell>
  );
}
