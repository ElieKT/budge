# Budge

A personal budgeting web app: manual income/expense tracking, monthly category
budgets, savings goals, recurring transactions, net worth (manual + optional
real bank/card sync), read-only investment tracking, a household
shared-expense ledger, and reports — built as a production-oriented Next.js
application, not a static prototype.

> **Status:** running against a real, provisioned PostgreSQL database (Neon)
> with all migrations applied. Deployment to a public URL (Vercel or
> otherwise) has **not** been done by this delivery — see
> [Deployment](#deployment) to do that yourself. See
> [Testing actually performed](#testing-actually-performed) and
> [What still depends on your setup](#what-still-depends-on-your-setup)
> before treating anything beyond what's explicitly listed there as verified.

---

## Contents

- [What this is](#what-this-is)
- [What this deliberately is not](#what-this-deliberately-is-not)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Connecting a real bank/card (Plaid)](#connecting-a-real-bankcard-plaid)
- [Recurring transactions — the scheduling caveat](#recurring-transactions--the-scheduling-caveat)
- [Testing actually performed](#testing-actually-performed)
- [Production build](#production-build)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [What still depends on your setup](#what-still-depends-on-your-setup)
- [Future-ready architecture](#future-ready-architecture)

---

## What this is

Budge lets a person register, sign in, and privately track their own personal
finances: log income and expenses, set monthly spending limits per category,
track savings goals (including one-click "starter buckets" like Travel or
Medical Emergency), see reports, track net worth across manually-entered or
Plaid-connected accounts, track investment holdings read-only, and split
shared expenses with a household or group. Every account's data is
isolated — there is no cross-account visibility, and there is no
unrestricted admin back door into user financial data (see
[Security notes](#security-notes)).

## What this deliberately is not

Two categories of feature were requested during this project and
deliberately **not** built, because building them for real crosses into
regulated financial-services territory that a codebase can't simply opt
into:

- **Sending real money between users.** That's money transmission, which
  requires state money-transmitter licensing (it's how Venmo/Cash
  App/PayPal are legally allowed to do it). This app never moves money
  between people — the [household ledger](#what-this-is) tracks who-owes-whom
  as bookkeeping only; settling up happens outside the app.
- **Placing real trades** (stocks or crypto) against a connected brokerage
  (Coinbase, Robinhood, etc.). That's broker-dealer/investment-adviser
  territory, and a bug there means real financial loss, not a wrong
  dashboard number. Investment tracking in this app is **read-only** — see
  the `InvestmentHolding` model and the Investments page; there is no
  "buy" or "sell" action anywhere in the code.

Neither is a placeholder waiting to be finished — they're a considered
boundary. If you fork this and want them anyway, know what you're signing
up for (licensing, compliance, and materially higher stakes for bugs)
before building on top of this codebase.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS (light + dark mode, user-selectable accent color) |
| Backend | Next.js Server Actions + a few Route Handlers (auth, cron) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) — credentials (email + password) provider, `bcryptjs` password hashing, Prisma adapter, Edge-safe middleware |
| Validation | Zod (client-usability + authoritative server-side validation, same schemas) |
| Charts | Recharts |
| Bank/card sync (optional) | Plaid (`transactions` product only — read-only) |
| Currency conversion | Frankfurter (free, keyless, ECB reference rates) |
| Unit/isolation tests | Vitest |
| E2E test (written, not run — see below) | Playwright |

## Architecture

- **Money is never a float.** Every amount is stored as an `Int` of integer
  minor units (cents) in Postgres and only ever converted to/from a decimal
  string at the UI boundary, in one shared module: [`src/lib/money.ts`](src/lib/money.ts).
  Share/coin quantities on investment holdings use Prisma's exact `Decimal`
  type (not a float either) since crypto routinely needs 8+ decimal places.
  All aggregation math lives in [`src/lib/calculations.ts`](src/lib/calculations.ts) — dashboard,
  budgets, net worth, household balances, and reports all call the same
  functions rather than re-deriving totals independently.
- **Server Actions are the API.** Each mutation (`src/server/actions/*.ts`)
  re-derives the current user from the server session
  (`requireUserId()` in [`src/lib/auth-guard.ts`](src/lib/auth-guard.ts)) — the
  client can never pass a `userId`. Every read or write of a user-owned row
  is scoped by that id, and ownership is re-checked on update/delete even
  though the id came from the client. Household actions additionally check
  `assertHouseholdMember()` before any read/write, and shared-expense
  splits are validated server-side against the household's real membership
  list (a client can't fabricate a split against an arbitrary user id). See
  `tests/*isolation*.test.ts` for isolation tests covering transactions,
  categories, savings goals, and households.
- **Validation is schema-based and duplicated deliberately in one place.**
  Every form uses a Zod schema from `src/lib/validation/`, and the
  corresponding Server Action re-validates the same schema server-side.
- **Recurring transactions are generated, not just labeled.** See the
  dedicated section below.
- **Bank/card sync is read-only by construction.** `src/lib/plaid.ts` only
  ever requests the `transactions` product — never `auth`, `transfer`, or
  `payment_initiation` (the products that would let an app move money).
  Access tokens are encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY`) and
  never sent to the client.
- **Theming is per-user, not per-deployment.** Accent color and light/dark
  theme are stored on `UserPreference` and applied via a CSS custom
  property (`--accent`) set server-side on `<html>` — see
  `src/app/layout.tsx`. The financial semantic colors (income green /
  expense red / budget status) are intentionally **not** customizable,
  since standardizing them is what makes "is this good or bad news"
  readable at a glance.
- **Route protection** is centralized in `src/middleware.ts` (redirects
  signed-out users to `/login`, signed-in users away from auth pages) and
  `src/app/(app)/layout.tsx` (redirects to `/onboarding` until it's
  completed). Middleware uses a deliberately minimal Edge-safe auth config
  (`src/auth.config.ts`) — the full config with `bcryptjs` and the Prisma
  adapter (`src/auth.ts`) is only ever loaded in Server Actions/Route
  Handlers, which run on the Node runtime, not Edge.

## Data model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma). Core budgeting
models (User, UserPreference, Category, Transaction, MonthlyBudget +
BudgetCategory, SavingsGoal, RecurringTransaction, PasswordResetToken) are
unchanged from the original release — see the schema file's inline comments
for each. Added in this pass:

- **FinancialAccount** — a bank account, card, loan, brokerage, retirement,
  or crypto account, either `MANUAL` (you type the balance) or `PLAID`
  (synced). Liability types (`CREDIT_CARD`, `LOAN`) store the amount owed
  as a positive number; net worth subtracts them
  (`src/lib/calculations.ts#netWorth`).
- **PlaidItem** — one linked institution login; holds the encrypted access
  token. Deleting it cascades to its `FinancialAccount` rows.
- **InvestmentHolding** — a read-only position (security name, ticker,
  asset class, quantity, cost basis, current value) attached to a
  `FinancialAccount`. No trade/order model exists anywhere in the schema.
- **Household / HouseholdMember / SharedExpense / SharedExpenseSplit** — the
  shared-expense ledger. `HouseholdMember` is the authorization boundary
  (see `assertHouseholdMember` in `src/server/data/household.ts`); a
  `SharedExpenseSplit` can only reference an actual member of that
  household, enforced in `src/server/actions/household.ts`.

Referential integrity: deleting a `User` cascades to every owned row
(including their household memberships and financial accounts). Deleting a
`Category` sets `Transaction.categoryId` to `NULL` (kept as
"Uncategorized") but cascades to `BudgetCategory` rows using it.

## Local setup

Prerequisites: Node.js 20+, a PostgreSQL 14+ database (a free
[Neon](https://neon.tech) or [Supabase](https://supabase.com) project needs
no local install and works well).

```bash
git clone <this-repo-url>
cd budge
npm install
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, CRON_SECRET, ENCRYPTION_KEY
npx prisma migrate deploy   # applies prisma/migrations/ to your database
npx prisma db seed          # seeds the 19 default categories (idempotent)
npm run dev                 # http://localhost:3000
```

Generate the three required secrets with:

```bash
# AUTH_SECRET and CRON_SECRET
openssl rand -base64 32
# ENCRYPTION_KEY (used only if you enable Plaid bank sync — still required
# by the app's env validation regardless)
openssl rand -hex 32
```

To also seed a demo account (`demo@budge.local` / `Demo1234!`) with a few
sample transactions, a budget, and a savings goal — **development only,
never run this against a production database**:

```bash
SEED_DEMO_USER=true npx prisma db seed
```

## Environment variables

All documented with inline comments in [`.env.example`](.env.example) — copy
it to `.env` for local dev.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Signs/encrypts Auth.js session JWTs |
| `NEXTAUTH_URL` | Yes | Public app URL — used for auth callbacks and the password-reset link |
| `CRON_SECRET` | Yes (for recurring transactions to run reliably) | Bearer token the recurring-transaction cron endpoint requires |
| `ENCRYPTION_KEY` | Yes | Encrypts Plaid access tokens at rest (AES-256-GCM) |
| `RESEND_API_KEY` / `EMAIL_FROM` | No | Real password-reset email delivery via Resend. Without it, links are logged to the server console (dev-only fallback) |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | No | Enables the "Connect a bank or card" button on the Accounts page. Without them, that page still works for manually-entered accounts |

None of these are ever sent to the browser — they're read only in Server
Actions, Route Handlers, and `next.config.ts`.

## Database migrations

Migrations live in `prisma/migrations/` (three so far: the initial schema,
`add_accounts_investments_household`, and `add_appearance_locale_prefs`).
All three have been **applied to a real, live Neon Postgres database** as
part of this delivery (not just generated and left unverified) — see
[Testing actually performed](#testing-actually-performed).

```bash
npx prisma migrate deploy   # applies pending migrations — safe for production
```

Going forward, every schema change should go through
`npx prisma migrate dev --name <description>` (in an interactive terminal —
it prompts for confirmation) so a new timestamped migration file is
committed alongside the schema change.

## Connecting a real bank/card (Plaid)

The Accounts page (`/accounts`) always supports manually-entered accounts.
To enable real (read-only) bank/card syncing:

1. Sign up at [dashboard.plaid.com/signup](https://dashboard.plaid.com/signup) — free, instant, Sandbox keys need no business verification.
2. Copy your **Sandbox** `client_id` and `secret` into `PLAID_CLIENT_ID` / `PLAID_SECRET`.
3. Restart the app. The "🔗 Connect a bank or card" button on `/accounts` will now open Plaid Link.
4. In Sandbox, pick any institution and log in with the fake credentials `user_good` / `pass_good` — Plaid returns realistic fake accounts and transactions, no real bank needed.
5. To go live with real banks later, complete Plaid's production access request and switch `PLAID_ENV` to `production` with production keys.

This was **not tested against Plaid in this delivery** — no Plaid keys were
provided. The integration code (`src/lib/plaid.ts`, `src/server/actions/plaid.ts`,
`src/components/accounts/PlaidConnectButton.tsx`) is written and type-checks
and builds cleanly, but the actual Link → exchange → sync flow has not been
exercised end-to-end. Treat it as implemented-but-unverified until you run
it with real Sandbox keys.

## Recurring transactions — the scheduling caveat

`RecurringTransaction` rules are real: `src/lib/recurring.ts` computes which
occurrences are due, anchored to the rule's `startDate` (not chained off the
previous occurrence) so a "bill due on the 31st" doesn't permanently drift
to the 28th the first time it crosses February — covered by a regression
test in `tests/recurring.test.ts`. `src/server/recurring-runner.ts`
materializes due occurrences as real `Transaction` rows inside a single
Prisma transaction, advancing `nextRunDate` so re-runs never double-create.

Two things trigger this: opportunistically on every login
(`src/app/(app)/layout.tsx`), and via `GET`/`POST /api/cron/recurring`
(bearer-token authenticated with `CRON_SECRET`) for every user regardless of
whether they've logged in. **(1) alone is not sufficient for production** —
a real deployment needs (2) actually scheduled. `vercel.json` configures a
daily Vercel Cron job for this; verify Vercel Cron is enabled for your
project after deploying, or point any other scheduler at the same endpoint.

## Testing actually performed

Run with `npm test` (Vitest). **Tests covering:**

- **Financial calculations** — income/expense totals, net cash flow,
  category spend, budget thresholds, savings progress, **net worth**
  (assets minus liabilities), and **household balance netting** — including
  zero, negative, and divide-by-zero edge cases.
- **Money handling** — decimal-string ↔ integer-cent conversion, rejecting
  malformed input rather than silently coercing it.
- **Recurring-transaction generation** — frequency math, catching up
  multiple missed periods, idempotency, the end-date/exhaustion path, and a
  regression test for month-end drift.
- **Date-range resolution**, **Zod validation schemas**, **auth guard**
  rejection of missing/insufficient sessions.
- **User-level data isolation** — transactions, categories, and savings
  goals (update/delete refuse to act unless the row's `userId` matches the
  session), **and households**: a non-member cannot add a member, add a
  shared expense, or remove another member from a household they don't
  belong to; a shared expense's splits are rejected if they reference a
  non-member or don't sum to the total.
- **Transaction filtering/pagination** — the transactions-list query always
  scopes by user id regardless of filters.

Also run and passing: `npx tsc --noEmit` and `npx eslint .`.

**Verified against a real, live database** (Neon Postgres) in this
delivery — not simulated:

- All three migrations applied cleanly via `prisma migrate deploy`.
- Default categories seeded via `prisma db seed`.
- The dev server ran against that live database (confirmed via HTTP 200 on
  the landing and login pages).

**Not executed, and you should verify these yourself:**

- `tests/e2e/main-journey.spec.ts` (Playwright) — written, not run in this
  session's terminal.
- The actual Plaid Link → token exchange → transaction sync flow (no Plaid
  keys were available) — see [above](#connecting-a-real-bankcard-plaid).
- Full manual click-through of every new page (Accounts, Investments,
  Household, Tools, Settings → Appearance/Language) in a real browser —
  these were built and type/lint-checked but not all manually clicked
  through by a human in this session.
- A real deployment to a public URL.

## Production build

Verified in this environment:

```bash
npm run build      # runs `prisma generate` then `next build`
npx tsc --noEmit    # type check
npx eslint .         # lint
npm test              # Vitest suite
```

The build does not require a live database connection (`prisma generate`
only reads the schema file; every authenticated page is dynamically
rendered per-request since it depends on the session).

## Deployment

1. **Provision Postgres** (if you haven't already) — Neon, Supabase,
   Railway, RDS all work. Copy the connection string into `DATABASE_URL`.
2. **Apply migrations once, before first traffic:**
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   DATABASE_URL="<production-url>" npx prisma db seed   # default categories only — never SEED_DEMO_USER in production
   ```
3. **Deploy the app** (Vercel is the easiest path for Next.js):
   - Import the repo in Vercel.
   - Set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` (your production URL),
     `CRON_SECRET`, and `ENCRYPTION_KEY` as encrypted **production**
     environment variables.
   - Optionally set `RESEND_API_KEY`/`EMAIL_FROM` (password-reset email)
     and `PLAID_CLIENT_ID`/`PLAID_SECRET`/`PLAID_ENV` (bank sync).
   - Confirm Vercel Cron is enabled so `vercel.json`'s daily
     `/api/cron/recurring` job actually runs.
4. **Verify after deploy:** register a real account, complete or skip
   onboarding, add a transaction, confirm the dashboard reflects it, and
   confirm `/api/cron/recurring` returns `401` without the bearer token and
   `200` with it.

Any other Node-hosting provider works too, as long as it runs
`next build && next start` and lets you schedule an HTTP call for the cron
endpoint.

## Security notes

- Passwords are hashed with `bcryptjs` (12 rounds).
- Every Server Action that touches user data starts with `requireUserId()`
  (or `assertHouseholdMember()` for household actions), re-deriving identity
  from the server-verified session — the client never supplies its own user
  id, and every Prisma query is scoped by it.
- Plaid access tokens are encrypted at rest (AES-256-GCM,
  `ENCRYPTION_KEY`) and never sent to the client. Only the read-only
  `transactions` product is requested — never a product capable of moving
  money.
- Password reset uses a single-use, sha256-hashed, 1-hour-expiring token;
  the request endpoint responds identically whether or not the email
  exists, to avoid account enumeration.
- `next.config.ts` sets `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS on every response.
- Middleware runs the minimal Edge-safe auth config
  (`src/auth.config.ts`) — `bcryptjs` and the Prisma adapter are only ever
  loaded server-side in the Node runtime (`src/auth.ts`), not bundled into
  Edge middleware.
- All database access goes through Prisma's parameterized query builder —
  no raw/string-concatenated SQL anywhere in the app.
- **Not implemented in v1:** rate limiting on login/registration/password-reset
  and on the currency-converter endpoint (a real deployment should add
  this). This is a genuine gap, not a hidden feature.
- There is no unrestricted admin panel. The `User.role` column exists for a
  future least-privilege admin surface but nothing reads it yet.

## What still depends on your setup

| Feature | Status |
|---|---|
| Manual income/expense/budget/savings/net-worth/investment tracking | Fully implemented, works with just a Postgres database |
| Household shared-expense ledger | Fully implemented, no external service needed — invites require the other person to already have a Budge account |
| Currency converter, world clock | Fully implemented, no signup needed (Frankfurter API is free and keyless) |
| Password reset **emails** | Silently logs to console without `RESEND_API_KEY` |
| Recurring transactions staying current for inactive users | Requires the cron endpoint actually being scheduled |
| Bank/card sync | Requires Plaid API keys (free Sandbox available); **not tested end-to-end in this delivery** |
| Language (French/Spanish) | Navigation and a few headings translate; most page/form copy is still English-only — see `src/lib/i18n.ts` |
| Dark mode / accent color | Fully implemented, no setup needed — Settings → Appearance |
| Profile picture | Fully implemented (stored as a data URL on the user record, max 500KB) |
| **Sending money between users** | **Not implemented — will not be** (money transmission; see [What this deliberately is not](#what-this-deliberately-is-not)) |
| **Trading stocks/crypto via a connected brokerage** | **Not implemented — will not be** (broker-dealer regulation; see [What this deliberately is not](#what-this-deliberately-is-not)) |
| Face ID / passkey login | Not implemented — see note below |
| Admin oversight dashboard | Not built — only a `role` column exists on `User` |
| CSV import/export, PDF reports | Not implemented |

A note on **Face ID / passkeys**: this wasn't built in this pass. The
correct way to add it is WebAuthn-based passkey support (Auth.js has an
experimental `@auth/webauthn` provider), where "Face ID" specifically is
just whichever platform authenticator (Face ID, Touch ID, Windows Hello, a
security key) the visitor's own OS/browser offers when they register a
passkey — it's not something a web app selects directly, and it's not
implemented as its own separate feature.

## Future-ready architecture

- **Multi-currency** — `currency` already exists on `Transaction` and
  `UserPreference`; the currency-converter tool already proves the exchange
  -rate lookup works. The remaining work is applying a conversion layer to
  actual balances/transactions.
- **CSV import/export, PDF reports** — the data-fetching layer
  (`src/server/data/*.ts`) already returns plain, serializable rows separate
  from rendering, so an export route can reuse it directly.
- **Net worth / investment sync going further** — `FinancialAccount` and
  `InvestmentHolding` are already shaped the way a Plaid Investments sync
  job would populate them; only the sync job itself remains.
- **Full localization** — `src/lib/i18n.ts`'s dictionary structure extends
  to more keys and locales without a schema change; moving to per-URL
  locale routing (e.g. `next-intl`) would be the next step for full
  coverage.
