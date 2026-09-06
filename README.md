# Budge

A personal budgeting web app: manual income/expense tracking, monthly category
budgets, savings goals, recurring transactions, and reports — built as a
production-oriented Next.js application, not a static prototype.

> **Status:** feature-complete for a v1 personal budgeting app and ready to
> deploy. It has **not** been deployed by this delivery, and its automated
> tests have **not** been run against a real PostgreSQL database (none was
> available in the environment this was built in) — see
> [Testing actually performed](#testing-actually-performed) and
> [What still depends on your setup](#what-still-depends-on-your-setup)
> before treating anything beyond that as verified.

---

## Contents

- [What this is](#what-this-is)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Recurring transactions — the scheduling caveat](#recurring-transactions--the-scheduling-caveat)
- [Testing actually performed](#testing-actually-performed)
- [Production build](#production-build)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [What still depends on your setup](#what-still-depends-on-your-setup)
- [Non-goals / not implemented](#non-goals--not-implemented)
- [Future-ready architecture](#future-ready-architecture)

---

## What this is

Budge lets a person register, sign in, and privately track their own personal
finances: log income and expenses, set monthly spending limits per category,
track savings goals, and see reports. Every account's data is isolated —
there is no cross-account visibility, and there is no unrestricted admin
back door into user financial data (see [Security notes](#security-notes)).

Money is manually entered. There is **no bank account connection** — the app
never asks for or stores banking credentials, and no transaction sync happens
automatically. That is a deliberate v1 scope decision (see
[Non-goals](#non-goals--not-implemented)), not a missing feature that's
secretly half-built.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS |
| Backend | Next.js Server Actions + a couple of Route Handlers (auth, cron) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) — credentials (email + password) provider, `bcryptjs` password hashing, Prisma adapter |
| Validation | Zod (client-usability + authoritative server-side validation, same schemas) |
| Charts | Recharts |
| Unit/isolation tests | Vitest |
| E2E test (written, not run — see below) | Playwright |

## Architecture

- **Money is never a float.** Every amount is stored as an `Int` of integer
  minor units (cents) in Postgres and only ever converted to/from a decimal
  string at the UI boundary, in one shared module: [`src/lib/money.ts`](src/lib/money.ts).
  All aggregation math lives in [`src/lib/calculations.ts`](src/lib/calculations.ts) — dashboard,
  budgets, and reports all call the same functions rather than re-deriving
  totals independently.
- **Server Actions are the API.** Each mutation (`src/server/actions/*.ts`)
  re-derives the current user from the server session
  (`requireUserId()` in [`src/lib/auth-guard.ts`](src/lib/auth-guard.ts)) — the
  client can never pass a `userId`. Every read or write of a user-owned row
  is scoped by that id (`where: { id, userId }`), and ownership is
  re-checked on update/delete even though the id came from the client. See
  `tests/transaction-actions.test.ts` and `tests/category-savings-isolation.test.ts`
  for isolation tests.
- **Validation is schema-based and duplicated deliberately in one place.**
  Every form uses a Zod schema from `src/lib/validation/`, and the
  corresponding Server Action re-validates the same schema server-side — the
  client-side check is only for responsiveness; the server never trusts it.
- **Recurring transactions are generated, not just labeled.** A
  `RecurringTransaction` row is a rule (frequency, start/end date, amount,
  category); actual `Transaction` rows are materialized from it by
  `src/server/recurring-runner.ts`, which is idempotent and catches up
  multiple missed periods in one pass. See the dedicated section below —
  this is the one feature with a real external dependency for full
  reliability.
- **Route protection** is centralized in `src/middleware.ts` (redirects
  signed-out users to `/login`, signed-in users away from auth pages) and
  `src/app/(app)/layout.tsx` (redirects to `/onboarding` until it's
  completed).

## Data model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma). Summary:

- **User** — email + bcrypt password hash, role (`USER`/`ADMIN`, only used to
  gate a possible future admin surface — nothing reads it yet), cascade-owns
  everything below.
- **UserPreference** — currency (`USD` only, exercised in v1 UI; the column
  and per-transaction `currency` field exist so multi-currency doesn't
  require a schema migration later), optional monthly income estimate,
  onboarding-completion timestamp.
- **Category** — `userId: null` rows are the 19 seeded system defaults
  (visible to everyone, not editable); `userId` set rows are a user's own
  custom categories. `kind` is `INCOME` or `EXPENSE`.
- **Transaction** — unified income/expense record: type, integer-cent
  amount, date, optional category (nullable — see below), merchant,
  description, notes, optional link back to the `RecurringTransaction` that
  generated it.
- **MonthlyBudget** + **BudgetCategory** — one budget per `(user, year,
  month)`, with one `BudgetCategory` allocation (a spending limit) per
  category in that budget.
- **SavingsGoal** — name, target/current amount (integer cents), optional
  target date and notes, completion flag.
- **RecurringTransaction** — the recurrence rule described above.
- **PasswordResetToken** — hashed, single-use, 1-hour-expiring token for the
  self-serve password reset flow (see below).

Referential integrity: deleting a `User` cascades to every owned row.
Deleting a `Category` a user created sets `Transaction.categoryId` to `NULL`
(the transaction is kept — shown as "Uncategorized" — rather than silently
deleted or blocked) but cascades the delete to any `BudgetCategory` rows
using it (a budget line for a category that no longer exists doesn't make
sense to keep). Indexes exist on every foreign key and on `(userId, date)` /
`(userId, type)` for the transaction list/filter queries.

## Local setup

Prerequisites: Node.js 20+, a PostgreSQL 14+ database (local via Docker, or
a free-tier managed instance — [Neon](https://neon.tech) and
[Supabase](https://supabase.com) both work well and require no local
install).

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, CRON_SECRET
npx prisma migrate deploy   # applies prisma/migrations/ to your database
npx prisma db seed          # seeds the 19 default categories (idempotent)
npm run dev                 # http://localhost:3000
```

To also seed a demo account (`demo@budge.local` / `Demo1234!`) with a few
sample transactions, a budget, and a savings goal — **development only,
never run this against a production database**:

```bash
SEED_DEMO_USER=true npx prisma db seed
```

## Environment variables

All documented with inline comments in [`.env.example`](.env.example) — copy
it to `.env` for local dev. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Signs/encrypts Auth.js session JWTs — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Public app URL — used for auth callbacks and building the password-reset link |
| `CRON_SECRET` | Yes (for recurring transactions to run reliably) | Bearer token the recurring-transaction cron endpoint requires |
| `RESEND_API_KEY` | No | Enables real password-reset emails via [Resend](https://resend.com). Without it, reset links are logged to the server console instead (dev-only fallback — see [`src/lib/email.ts`](src/lib/email.ts)) |
| `EMAIL_FROM` | No | From-address for reset emails, if `RESEND_API_KEY` is set |

None of these are ever sent to the browser — they're read only in Server
Actions, Route Handlers, and `next.config.ts`, none of which ship to the
client bundle.

## Database migrations

Migrations live in `prisma/migrations/`. The initial migration was generated
with `prisma migrate diff` (schema-to-SQL, no live database required, since
none was available while building this) rather than `prisma migrate dev`
against a running Postgres — the SQL is what `migrate dev` would have
produced, but it has not actually been executed against a live database as
part of this delivery. Before relying on it:

```bash
npx prisma migrate deploy   # applies pending migrations — safe for production
# or, in local dev, to also let Prisma manage drift interactively:
npx prisma migrate dev
```

Going forward, every schema change should go through
`npx prisma migrate dev --name <description>` so a new timestamped migration
file is committed alongside the schema change.

## Recurring transactions — the scheduling caveat

`RecurringTransaction` rules are real: `src/lib/recurring.ts` computes which
occurrences are due (anchored to the rule's `startDate`, so a "bill due on
the 31st" doesn't permanently drift to the 28th the first time it crosses
February — see `tests/recurring.test.ts`), and
`src/server/recurring-runner.ts` materializes them as real `Transaction`
rows inside a single Prisma transaction, advancing `nextRunDate` so re-runs
never double-create.

Two things trigger this:

1. **Opportunistically, on login** — `src/app/(app)/layout.tsx` runs it for
   the signed-in user on every authenticated page load. This means an
   active user's recurring transactions always appear up to date by the
   time they look.
2. **`POST`/`GET /api/cron/recurring`** — runs it for every user, guarded by
   a bearer token (`Authorization: Bearer $CRON_SECRET`). This is what keeps
   a user's recurring transactions current even if they don't log in for a
   while.

**(1) alone is not sufficient for a production deployment** — a user who
doesn't visit the app won't have their recurring transactions generated
until they do, which is fine for their own view but means (2) is what a real
deployment depends on for timeliness. `vercel.json` in this repo configures
a daily Vercel Cron job calling that endpoint, which Vercel automatically
authenticates with `CRON_SECRET` when it's set as a project environment
variable. **This requires the Vercel Cron feature to actually be enabled for
your project/plan** — verify it in the Vercel dashboard after deploying,
or point any other scheduler (GitHub Actions on a `schedule` trigger,
cron-job.org, etc.) at the same endpoint with the same header.

## Testing actually performed

Run with `npm test` (Vitest). **86 tests, all passing**, covering:

- **Financial calculations** (`tests/calculations.test.ts`) — income/expense
  totals, net cash flow, category spend, budget remaining/percentage/status
  thresholds, savings progress — including zero, negative, and
  divide-by-zero edge cases.
- **Money handling** (`tests/money.test.ts`) — decimal-string ↔ integer-cent
  conversion, rejecting malformed input (`"abc"`, `"$12"`, `"12.999"`,
  `"1,200"`) rather than silently coercing it.
- **Recurring-transaction generation** (`tests/recurring.test.ts`) —
  frequency math, catching up multiple missed periods in one pass,
  idempotency, the end-date/exhaustion path, and a regression test for the
  month-end drift bug described above.
- **Date-range resolution** (`tests/period.test.ts`) — each dashboard/report
  period option, and safe fallback for an invalid custom range.
- **Zod validation schemas** (`tests/validation.test.ts`) — amount, date,
  category, password-complexity, and budget-allocation rules.
- **Auth guard** (`tests/auth-guard.test.ts`) — `requireUserId`/`requireAdmin`
  throw for a missing/insufficient session rather than silently proceeding.
- **User-level data isolation** (`tests/transaction-actions.test.ts`,
  `tests/category-savings-isolation.test.ts`) — update/delete actions for
  transactions, categories, and savings goals are proven, via a mocked
  Prisma client, to look up the target row scoped to the current user's id
  first and to refuse to mutate anything when that lookup fails (i.e.
  another user's id can't be used to touch your data), plus the
  create-path amount-to-cents conversion and cross-user category-injection
  rejection.
- **Transaction filtering/pagination** (`tests/transactions-data.test.ts`) —
  the transactions-list query always scopes by user id regardless of
  filters, and date/type/pagination params translate into the correct
  Prisma `where`/`skip`/`take`.

Also run and passing: `npx tsc --noEmit` (clean) and `npx eslint .` (clean).

**Not executed, and you should run them yourself before trusting them:**

- `tests/e2e/main-journey.spec.ts` (Playwright) — written to cover
  register → onboarding → create a budget → add an expense → see it on the
  dashboard, but **not run**, because this environment had no live
  PostgreSQL database to run the app against. Run with
  `npm run test:e2e` once you have `DATABASE_URL` pointed at a real,
  migrated database.
- Any migration (`prisma migrate deploy`/`dev`) against an actual Postgres
  instance — the schema was validated (`prisma validate`) and its SQL was
  generated and inspected, but never applied to a live database.
- Manual mobile/desktop layout QA in a real browser.
- Manual verification that the deployed app builds and runs on a hosting
  provider (see [Production build](#production-build) for what *was*
  verified locally).

## Production build

Verified in this environment:

```bash
npm run build   # runs `prisma generate` then `next build` — succeeds
npx tsc --noEmit   # no type errors
npx eslint .       # no errors or warnings
npm test           # 86/86 passing
```

The build does not require a live database connection (`prisma generate`
only reads the schema file; no page performs a build-time database query —
every authenticated page is dynamically rendered per-request since it
depends on the session).

## Deployment

1. **Provision Postgres.** Any managed provider works — Neon, Supabase,
   Railway, RDS. Copy its connection string into `DATABASE_URL`.
2. **Apply migrations against it once, before first traffic:**
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   DATABASE_URL="<production-url>" npx prisma db seed   # default categories only — do NOT set SEED_DEMO_USER
   ```
3. **Deploy the app** (Vercel is the easiest path for a Next.js app):
   - Import the repo in Vercel.
   - Set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` (your production
     URL), and `CRON_SECRET` as encrypted **production** environment
     variables — never commit them.
   - Optionally set `RESEND_API_KEY`/`EMAIL_FROM` to enable real
     password-reset emails.
   - Confirm Vercel Cron is enabled for the project so `vercel.json`'s daily
     `/api/cron/recurring` job actually runs (see the caveat above).
4. **Verify after deploy:** register a real account, confirm you land in
   onboarding, complete or skip it, create a transaction, and confirm the
   dashboard reflects it. Confirm `/api/cron/recurring` returns `401`
   without the bearer token and `200` with it.

Any other Node-hosting provider works too, as long as it runs
`next build && next start` and lets you configure a scheduled HTTP call for
the cron endpoint — Vercel Cron is convenient, not required.

## Security notes

- Passwords are hashed with `bcryptjs` (12 rounds) — never stored or logged
  in plain text.
- Every Server Action that touches user data starts with
  `requireUserId()`, which re-derives identity from the server-verified
  session — the client never supplies its own user id, and every Prisma
  query is scoped by it.
- Password reset uses a single-use, sha256-hashed, 1-hour-expiring token; the
  request endpoint always responds identically whether or not the email
  exists, to avoid account enumeration.
- `next.config.ts` sets `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS on every response.
- Auth.js's built-in CSRF protection covers the credentials sign-in flow;
  Server Actions carry their own same-origin enforcement from Next.js.
- All database access goes through Prisma's parameterized query builder —
  no raw/string-concatenated SQL anywhere in the app.
- No database credentials, API keys, or auth secrets are referenced from any
  Client Component — they're only read in Server Actions, Route Handlers,
  and `next.config.ts`. `src/server/data/*.ts` and `src/server/recurring-runner.ts`
  are marked `import "server-only"` so an accidental client import fails at
  build time instead of silently bundling server code.
- **Not implemented in v1:** rate limiting on login/registration/password-reset
  (a real deployment should add this — e.g. Vercel's Attack Challenge Mode,
  or a token-bucket check backed by Redis/Upstash — before considering the
  app abuse-resistant against credential stuffing). This is a genuine gap,
  not a hidden feature.
- There is no unrestricted admin panel. The `User.role` column exists for a
  future least-privilege admin surface (aggregate counts, account status —
  never other users' financial records) but nothing reads it yet; treat any
  claim otherwise as false until such a page is actually built.

## What still depends on your setup

Being upfront about what this codebase provides versus what only works once
you configure something external:

| Feature | Status |
|---|---|
| Manual income/expense/budget/savings tracking | Fully implemented, works with just a Postgres database |
| Password reset **emails** | Implemented, but silently no-ops to a console log without `RESEND_API_KEY` — see [`src/lib/email.ts`](src/lib/email.ts) |
| Recurring transactions staying current for inactive users | Requires the cron endpoint actually being called on a schedule (Vercel Cron or equivalent) — see above |
| Bank account sync | **Not implemented at all** — would require integrating a provider like Plaid; nothing in this codebase talks to one |
| Multiple currencies | Schema supports it (a `currency` column exists); no UI or conversion logic exists to actually use anything but USD |
| Admin oversight dashboard | Not built — only a `role` column exists on `User` |
| CSV import/export, PDF reports | Not implemented |

## Non-goals / not implemented

Per the v1 scope: no investment trading, no moving money between accounts,
no storage of banking login credentials, no tax/investment/legal advice, and
no UI element that implies a working integration that isn't actually wired
up (there is nothing that looks like a bank-connect button, for instance).

## Future-ready architecture

Nothing here was built to make these harder later, but none of them are
implemented now:

- **Bank sync / card sync** — `Transaction.categoryId`/`recurringTransactionId`
  and the manual-entry Server Actions are already the same shape a
  Plaid-backed import job would populate; a sync job would just create
  `Transaction` rows the same way `src/server/actions/transactions.ts` does.
- **Multi-currency** — `currency` already exists on `Transaction` and
  `UserPreference`; the only work left is a rate-conversion layer and
  currency-aware formatting (`src/lib/money.ts` already takes a `currency`
  parameter).
- **CSV import/export, PDF reports** — the data-fetching layer
  (`src/server/data/*.ts`) already returns plain, serializable rows separate
  from any rendering, so an export route can reuse it directly.
- **Shared/household budgets, net worth, debt payoff, subscriptions, bill
  reminders, push notifications, native apps, premium tiers** — none of
  these have supporting schema yet; they'd each need their own migration,
  but nothing in the current schema or auth model conflicts with adding
  them (e.g. `MonthlyBudget`/`SavingsGoal` could gain an optional
  `householdId` alongside `userId` without breaking the single-user case).

---

## Implementation summary

**What was implemented:** full-stack personal budgeting app — registration,
login/logout, password reset (see email caveat above), profile settings,
account deletion, onboarding wizard, dashboard (balance, income/expenses,
net cash flow, spending-by-category chart, budget progress, savings
progress, 6-month income/expense trend, recent transactions), unified
transactions view (search/filter/sort/paginate/edit/delete), category
management (14 default expense + 5 default income categories, plus custom
categories), monthly budgets with per-category limits and copy-from-previous-month,
savings goals with progress tracking, recurring transactions (weekly through
annual, with real occurrence generation), and reports (income vs. expenses,
category breakdown, budget vs. actual).

**Technical stack:** Next.js 15 (App Router) + TypeScript + React 19,
Tailwind CSS, Prisma + PostgreSQL, Auth.js v5 (credentials provider,
bcrypt), Zod, Recharts, Vitest.

**Database architecture:** see [Data model](#data-model) above;
full schema in `prisma/schema.prisma`.

**Authentication method:** Auth.js (NextAuth) credentials provider —
email + bcrypt-hashed password, JWT session strategy, Prisma adapter.
Self-serve password reset via a hashed single-use token. No OAuth providers
are wired up in v1 (the schema's `Account` table exists for adding one
later without a migration).

**Main application routes:** `/`, `/login`, `/register`, `/forgot-password`,
`/reset-password/[token]`, `/onboarding`, `/dashboard`, `/transactions`,
`/budgets`, `/savings-goals`, `/reports`, `/categories`, `/recurring`,
`/settings`, plus `POST /api/auth/*` (Auth.js) and `GET|POST
/api/cron/recurring`.

**External services required:** a PostgreSQL database (required). A
transactional email provider (Resend, optional — only for real
password-reset delivery). A scheduler capable of an authenticated HTTP call
(Vercel Cron or equivalent, optional but recommended — only for keeping
recurring transactions current for inactive users). Nothing else is
required to run the app.

**Environment variables required:** `DATABASE_URL`, `AUTH_SECRET`,
`NEXTAUTH_URL`, `CRON_SECRET` required; `RESEND_API_KEY`/`EMAIL_FROM`
optional. Full descriptions in `.env.example`.

**Testing actually performed:** see
[Testing actually performed](#testing-actually-performed) above in full —
in short, 86 Vitest unit/isolation tests passing, `tsc --noEmit` clean,
`eslint` clean, production build succeeds; Playwright e2e test written but
not run (no database available in this environment); no migration was ever
applied to a live database.

**Deployment procedure:** see [Deployment](#deployment) above.

**Functionality that remains dependent on external configuration:** real
password-reset email delivery (needs `RESEND_API_KEY`), reliable recurring-transaction
generation for inactive users (needs the cron endpoint scheduled),
and everything listed in
[What still depends on your setup](#what-still-depends-on-your-setup).

No claim in this document describes a check that wasn't actually run, a
deployment that wasn't actually made, or a feature that isn't actually in
the code linked above.
