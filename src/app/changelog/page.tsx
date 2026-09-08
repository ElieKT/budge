import { PublicPageShell } from "@/components/layout/PublicPageShell";

type Entry = { date: string; items: string[] };

// Newest first. Written by hand for each release, in plain language — not
// raw commit messages. Update this list alongside meaningful, user-visible
// changes; it isn't generated automatically.
const ENTRIES: Entry[] = [
  {
    date: "2026-09-08",
    items: [
      "Added a Debt Payoff Planner — track balances, APR, and minimum payments, and compare Avalanche vs. Snowball payoff strategies month-by-month.",
      "Added Subscription Radar — every recurring bill normalized to a monthly/annual cost, with a nudge to review anything you haven't touched in 90+ days.",
      "Added life-event budget templates (New Job, Moving Out, New Baby, Debt Payoff Push, Wedding) alongside the general Balanced/Bare Bones/Aggressive Saver splits.",
      "Added a Privacy Mode toggle that blurs dollar amounts across the app — handy for screen-sharing.",
      "Added a shareable progress image for savings goals, with an option to hide exact amounts.",
      "Added a Security &amp; Privacy Practices page.",
      "Household members can now leave a household themselves, not just be removed by the owner.",
      "Transactions can now have a receipt photo attached.",
      "Made the Budge logo larger across the app.",
    ],
  },
  {
    date: "2026-09-07",
    items: [
      "Fixed a crash on the Budgets page (and a few others) that could happen right after creating certain records.",
      "Fixed unreadable text in dark mode across forms and shared components.",
      "Fixed avatar photo uploads failing for typical phone-camera photo sizes.",
      "Expanded currency support — the converter and live exchange rates now cover 160+ currencies, including many African currencies previously missing.",
      "Added a Tools page: currency converter, live exchange rates, world clock &amp; weather, and market headlines.",
      "Made the Tools page's data tables scroll within their own box instead of stretching the whole page.",
      "Added Contact Us, Help, Privacy Policy, and Terms pages, plus an account menu.",
    ],
  },
  {
    date: "2026-09-06 to 2026-09-07",
    items: [
      "Launched Budge: dashboard, transactions, budgets, savings goals, recurring transactions, reports, and categories.",
      "Added net worth tracking, read-only investment tracking, and an optional bank sync via Plaid.",
      "Added a household shared-expense ledger for splitting bills with roommates or family — no real money moves through it.",
      "Added appearance customization: avatar photo, accent color, and dark mode.",
      "Added support for English, French, and Spanish navigation.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <PublicPageShell title="Changelog">
      <p>What&apos;s changed in Budge, newest first.</p>
      <div className="space-y-8">
        {ENTRIES.map((entry) => (
          <div key={entry.date}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{entry.date}</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
