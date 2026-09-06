import { expect, test } from "@playwright/test";

/**
 * Covers the primary user journey end to end: register, land in onboarding,
 * skip it, create a budget, add an expense, and see the dashboard reflect
 * it. Requires `DATABASE_URL` to point at a real, migrated Postgres
 * instance and the app to be built/served (see playwright.config.ts).
 *
 * NOT executed in this delivery — this sandbox has no provisioned
 * PostgreSQL database (see README "Testing actually performed"). Run it
 * yourself with `npm run test:e2e` once `DATABASE_URL` points at a real
 * database with migrations applied.
 */
test("register, create a budget, add an expense, see it on the dashboard", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("GoodPassword1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: "Skip setup" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/budgets");
  await page.getByRole("button", { name: "Create budget" }).click();
  await page.getByLabel("Limit (USD)").first().fill("300");
  await page.getByRole("button", { name: "Save budget" }).click();
  await expect(page.getByText("Total planned")).toBeVisible();

  await page.goto("/transactions");
  await page.getByRole("button", { name: "+ Add transaction" }).click();
  await page.getByRole("button", { name: "Expense" }).click();
  await page.getByLabel("Amount (USD)").fill("42.50");
  await page.getByLabel("Merchant").fill("Trader Joe's");
  await page.getByRole("button", { name: "Add transaction" }).click();
  await expect(page.getByText("Trader Joe's")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("$42.50")).toBeVisible();
});
