/** One-click starter savings buckets — purely a convenience over creating each SavingsGoal by hand. */
export const SAVINGS_GOAL_TEMPLATES: Array<{ name: string; targetAmountCents: number }> = [
  { name: "Travel", targetAmountCents: 200000 },
  { name: "Medical Emergency", targetAmountCents: 150000 },
  { name: "Eating Out", targetAmountCents: 30000 },
  { name: "Transportation", targetAmountCents: 100000 },
  { name: "Home Repairs", targetAmountCents: 250000 },
  { name: "Holiday Gifts", targetAmountCents: 50000 },
  { name: "New Vehicle", targetAmountCents: 1000000 },
  { name: "Wedding", targetAmountCents: 1000000 },
];
