import { PublicPageShell } from "@/components/layout/PublicPageShell";
import { CONTACT } from "@/lib/contact";

export default function SecurityPage() {
  return (
    <PublicPageShell title="Security &amp; Privacy Practices">
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This page describes what Budge actually does today, in plain language — it isn&apos;t a
        compliance certification (no SOC 2, no third-party audit) and isn&apos;t legal advice. See the{" "}
        <a href="/privacy" className="underline">Privacy Policy</a> for the formal policy.
      </div>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Bank credentials never touch our servers</h2>
      <p>
        Budge is manual-entry-first by design — you don&apos;t need to link a bank account at all to
        use it. If you choose to connect one anyway, that connection goes through Plaid&apos;s own
        secure interface: your bank username and password are typed directly into Plaid, never into
        Budge, and we never see or store them. We receive only a read-only access token.
      </p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">That access token is encrypted at rest</h2>
      <p>
        A Plaid access token is a real credential, so it&apos;s treated like one: encrypted with
        AES-256-GCM using a server-only key before it&apos;s ever written to the database, and
        decrypted only in memory when a sync actually runs. It&apos;s never logged and never sent to
        your browser.
      </p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Passwords are hashed, never stored in plain text</h2>
      <p>
        Your password is run through bcrypt before it&apos;s stored — Budge itself cannot look up or
        recover your actual password, only verify a login attempt against the hash. Password-reset
        links are single-use and expire.
      </p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Every account&apos;s data is isolated</h2>
      <p>
        Every transaction, budget, goal, and account is scoped to the signed-in user at the database
        query level — there is no shared pool of financial data and no unrestricted administrative
        view into it. A household&apos;s shared-expense ledger is visible only to that household&apos;s
        members, and never moves real money between them.
      </p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Read-only, always</h2>
      <p>
        Budge never initiates a transfer, payment, or trade anywhere — not through Plaid, not through
        the household ledger, not anywhere in the app. Investment tracking is informational only; there
        is no brokerage connection that can place an order.
      </p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Encrypted in transit</h2>
      <p>Every connection to Budge is served over HTTPS. There is no plain-HTTP fallback.</p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">You can delete everything</h2>
      <p>
        Deleting your account from Settings permanently removes your data — there&apos;s no
        soft-delete or 30-day grace copy kept around afterward.
      </p>

      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Questions or concerns</h2>
      <p>
        Found something that doesn&apos;t look right, or have a question about how something works?{" "}
        <a href={`mailto:${CONTACT.email}`} className="hover:underline" style={{ color: "var(--accent)" }}>
          {CONTACT.email}
        </a>{" "}
        or {CONTACT.phone}.
      </p>
    </PublicPageShell>
  );
}
