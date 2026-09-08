/**
 * Starter budget templates — a percentage-of-income split (needs/wants/
 * savings) mapped onto Budge's default expense categories, so a user can
 * pick one, confirm their monthly income, and get a full set of category
 * limits to start from instead of typing every line by hand. Every number
 * is just a suggested starting point — nothing here is financial advice,
 * and every allocation is fully editable before (and after) it's applied.
 */

export type BudgetTemplateKey = "BALANCED" | "BARE_BONES" | "AGGRESSIVE_SAVER";

export const BUDGET_TEMPLATES: Record<BudgetTemplateKey, { name: string; description: string; needs: number; wants: number; savings: number }> = {
  BALANCED: {
    name: "Balanced (50/30/20)",
    description: "The classic split: half to needs, 30% to wants, 20% to savings.",
    needs: 0.5,
    wants: 0.3,
    savings: 0.2,
  },
  BARE_BONES: {
    name: "Bare Bones",
    description: "For a tight month — most of your income covers essentials, with a little breathing room.",
    needs: 0.7,
    wants: 0.1,
    savings: 0.2,
  },
  AGGRESSIVE_SAVER: {
    name: "Aggressive Saver",
    description: "Trims wants further to push savings up to 30%.",
    needs: 0.5,
    wants: 0.2,
    savings: 0.3,
  },
};

// How each bucket's share of income splits across default expense
// categories. Weights within a bucket sum to 1. Categories not present in
// a user's account (renamed/deleted defaults) are simply skipped when the
// template is applied — see src/server/actions/budgetTemplates.ts.
const NEEDS_WEIGHTS: Record<string, number> = {
  Housing: 0.4,
  Groceries: 0.2,
  Utilities: 0.1,
  Transport: 0.1,
  Insurance: 0.08,
  Healthcare: 0.07,
  Childcare: 0.03,
  "Debt Payments": 0.02,
};

const WANTS_WEIGHTS: Record<string, number> = {
  Shopping: 0.3,
  Dining: 0.3,
  Entertainment: 0.25,
  Education: 0.1,
  Other: 0.05,
};

const SAVINGS_WEIGHTS: Record<string, number> = {
  Savings: 1,
};

export type TemplateAllocation = { categoryName: string; amountCents: number };

/** Computes suggested category limits (integer cents) for a template given a monthly income in cents. */
export function computeTemplateAllocations(templateKey: BudgetTemplateKey, monthlyIncomeCents: number): TemplateAllocation[] {
  const template = BUDGET_TEMPLATES[templateKey];
  const buckets: [number, Record<string, number>][] = [
    [template.needs, NEEDS_WEIGHTS],
    [template.wants, WANTS_WEIGHTS],
    [template.savings, SAVINGS_WEIGHTS],
  ];

  const allocations: TemplateAllocation[] = [];
  for (const [bucketShare, weights] of buckets) {
    const bucketCents = Math.round(monthlyIncomeCents * bucketShare);
    for (const [categoryName, weight] of Object.entries(weights)) {
      const amountCents = Math.round(bucketCents * weight);
      if (amountCents > 0) allocations.push({ categoryName, amountCents });
    }
  }
  return allocations;
}
