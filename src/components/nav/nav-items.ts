import type { DictionaryKey } from "@/lib/i18n";

type NavItem = { href: string; label: string; key: DictionaryKey };

const DASHBOARD: NavItem = { href: "/dashboard", label: "Dashboard", key: "nav_dashboard" };
const TRANSACTIONS: NavItem = { href: "/transactions", label: "Transactions", key: "nav_transactions" };
const BUDGETS: NavItem = { href: "/budgets", label: "Budgets", key: "nav_budgets" };
const SAVINGS_GOALS: NavItem = { href: "/savings-goals", label: "Savings Goals", key: "nav_savings_goals" };
const DEBT_PAYOFF: NavItem = { href: "/debt-payoff", label: "Debt Payoff", key: "nav_debt_payoff" };
const ACCOUNTS: NavItem = { href: "/accounts", label: "Accounts", key: "nav_accounts" };
const INVESTMENTS: NavItem = { href: "/investments", label: "Investments", key: "nav_investments" };
const HOUSEHOLD: NavItem = { href: "/household", label: "Household", key: "nav_household" };
const REPORTS: NavItem = { href: "/reports", label: "Reports", key: "nav_reports" };
const RECURRING: NavItem = { href: "/recurring", label: "Recurring", key: "nav_recurring" };
const SUBSCRIPTIONS: NavItem = { href: "/subscriptions", label: "Subscriptions", key: "nav_subscriptions" };
const CATEGORIES: NavItem = { href: "/categories", label: "Categories", key: "nav_categories" };
const TOOLS: NavItem = { href: "/tools", label: "Tools", key: "nav_tools" };
const SETTINGS: NavItem = { href: "/settings", label: "Settings", key: "nav_settings" };

export const NAV_ITEMS: NavItem[] = [
  DASHBOARD,
  TRANSACTIONS,
  BUDGETS,
  SAVINGS_GOALS,
  DEBT_PAYOFF,
  ACCOUNTS,
  INVESTMENTS,
  HOUSEHOLD,
  REPORTS,
  RECURRING,
  SUBSCRIPTIONS,
  CATEGORIES,
  TOOLS,
  SETTINGS,
];

// Subset shown in the mobile bottom tab bar — keep to 5 for thumb reach.
export const MOBILE_NAV_ITEMS: NavItem[] = [DASHBOARD, TRANSACTIONS, BUDGETS, SAVINGS_GOALS, CATEGORIES];
