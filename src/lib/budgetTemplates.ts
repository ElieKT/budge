/**
 * Starter budget templates — a percentage-of-income split (needs/wants/
 * savings) mapped onto Budge's default expense categories, so a user can
 * pick one, confirm their monthly income, and get a full set of category
 * limits to start from instead of typing every line by hand. Every number
 * is just a suggested starting point — nothing here is financial advice,
 * and every allocation is fully editable before (and after) it's applied.
 *
 * Beyond the three general-purpose splits, a handful of life-event
 * templates tune not just the top-level percentages but which categories
 * get emphasis within the "needs" bucket (e.g. Childcare/Healthcare for a
 * new baby, Housing for moving out) — a flat 50/30/20 doesn't fit those
 * moments well.
 */

export type BudgetTemplateKey =
  | "BALANCED"
  | "BARE_BONES"
  | "AGGRESSIVE_SAVER"
  | "NEW_JOB"
  | "MOVING_OUT"
  | "NEW_BABY"
  | "PAYING_OFF_DEBT"
  | "WEDDING";

type BucketWeights = Record<string, number>;

type BudgetTemplateDef = {
  name: string;
  description: string;
  group: "General" | "Life events";
  needs: number;
  wants: number;
  savings: number;
  /** Overrides the default weighting *within* a bucket for this template.
   * Falls back to NEEDS_WEIGHTS/WANTS_WEIGHTS/SAVINGS_WEIGHTS when absent. */
  needsWeights?: BucketWeights;
  wantsWeights?: BucketWeights;
  savingsWeights?: BucketWeights;
};

export const BUDGET_TEMPLATES: Record<BudgetTemplateKey, BudgetTemplateDef> = {
  BALANCED: {
    name: "Balanced (50/30/20)",
    description: "The classic split: half to needs, 30% to wants, 20% to savings.",
    group: "General",
    needs: 0.5,
    wants: 0.3,
    savings: 0.2,
  },
  BARE_BONES: {
    name: "Bare Bones",
    description: "For a tight month — most of your income covers essentials, with a little breathing room.",
    group: "General",
    needs: 0.7,
    wants: 0.1,
    savings: 0.2,
  },
  AGGRESSIVE_SAVER: {
    name: "Aggressive Saver",
    description: "Trims wants further to push savings up to 30%.",
    group: "General",
    needs: 0.5,
    wants: 0.2,
    savings: 0.3,
  },
  NEW_JOB: {
    name: "New Job / First Paycheck",
    description: "Starting fresh with a new income — build good saving habits from the first check, not after a review.",
    group: "Life events",
    needs: 0.5,
    wants: 0.25,
    savings: 0.25,
  },
  MOVING_OUT: {
    name: "Moving Out / First Apartment",
    description: "Set-up costs and rent dominate the first few months on your own — savings takes a back seat for now.",
    group: "Life events",
    needs: 0.62,
    wants: 0.23,
    savings: 0.15,
    needsWeights: {
      Housing: 0.5,
      Groceries: 0.15,
      Utilities: 0.12,
      Transport: 0.08,
      Insurance: 0.07,
      Healthcare: 0.05,
      Childcare: 0.01,
      "Debt Payments": 0.02,
    },
  },
  NEW_BABY: {
    name: "Growing Family / New Baby",
    description: "Childcare and healthcare take a much bigger share — wants shrink to make room.",
    group: "Life events",
    needs: 0.6,
    wants: 0.15,
    savings: 0.25,
    needsWeights: {
      Housing: 0.3,
      Groceries: 0.18,
      Utilities: 0.08,
      Transport: 0.08,
      Insurance: 0.1,
      Healthcare: 0.14,
      Childcare: 0.1,
      "Debt Payments": 0.02,
    },
  },
  PAYING_OFF_DEBT: {
    name: "Debt Payoff Push",
    description: "Wants are trimmed hard and the 'savings' share goes straight at debt instead — pair this with the Debt Payoff planner.",
    group: "Life events",
    needs: 0.5,
    wants: 0.15,
    savings: 0.35,
    savingsWeights: { "Debt Payments": 1 },
  },
  WEDDING: {
    name: "Saving for a Wedding",
    description: "A bigger savings share to build a wedding fund, without cutting essentials.",
    group: "Life events",
    needs: 0.5,
    wants: 0.2,
    savings: 0.3,
  },
};

// How each bucket's share of income splits across default expense
// categories. Weights within a bucket sum to 1. Categories not present in
// a user's account (renamed/deleted defaults) are simply skipped when the
// template is applied — see src/server/actions/budgets.ts#applyBudgetTemplate.
const NEEDS_WEIGHTS: BucketWeights = {
  Housing: 0.4,
  Groceries: 0.2,
  Utilities: 0.1,
  Transport: 0.1,
  Insurance: 0.08,
  Healthcare: 0.07,
  Childcare: 0.03,
  "Debt Payments": 0.02,
};

const WANTS_WEIGHTS: BucketWeights = {
  Shopping: 0.3,
  Dining: 0.3,
  Entertainment: 0.25,
  Education: 0.1,
  Other: 0.05,
};

const SAVINGS_WEIGHTS: BucketWeights = {
  Savings: 1,
};

export type TemplateAllocation = { categoryName: string; amountCents: number };

/** Computes suggested category limits (integer cents) for a template given a monthly income in cents. */
export function computeTemplateAllocations(templateKey: BudgetTemplateKey, monthlyIncomeCents: number): TemplateAllocation[] {
  const template = BUDGET_TEMPLATES[templateKey];
  const buckets: [number, BucketWeights][] = [
    [template.needs, template.needsWeights ?? NEEDS_WEIGHTS],
    [template.wants, template.wantsWeights ?? WANTS_WEIGHTS],
    [template.savings, template.savingsWeights ?? SAVINGS_WEIGHTS],
  ];

  // Categories that appear in more than one bucket (e.g. "Debt Payments" in
  // both needs and the debt-payoff template's savings override) should add
  // up rather than the second bucket clobbering the first.
  const totals = new Map<string, number>();
  for (const [bucketShare, weights] of buckets) {
    const bucketCents = Math.round(monthlyIncomeCents * bucketShare);
    for (const [categoryName, weight] of Object.entries(weights)) {
      const amountCents = Math.round(bucketCents * weight);
      if (amountCents > 0) totals.set(categoryName, (totals.get(categoryName) ?? 0) + amountCents);
    }
  }
  return Array.from(totals, ([categoryName, amountCents]) => ({ categoryName, amountCents }));
}
