export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/savings-goals", label: "Savings Goals" },
  { href: "/reports", label: "Reports" },
  { href: "/recurring", label: "Recurring" },
  { href: "/categories", label: "Categories" },
  { href: "/settings", label: "Settings" },
] as const;

// Subset shown in the mobile bottom tab bar — keep to 5 for thumb reach.
export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[4],
];
