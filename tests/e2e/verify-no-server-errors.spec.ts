import { expect, test } from "@playwright/test";

/**
 * One-off verification script (not part of the permanent suite) written to
 * confirm the "Functions cannot be passed directly to Client Components"
 * RSC bug is actually fixed everywhere, after it slipped past tsc/eslint/
 * vitest/next build and only surfaced as a real production crash. Registers
 * a throwaway user, creates one of each entity that renders a
 * ConfirmDeleteButton from a Server Component, and asserts the generic
 * Next.js error page never appears on any page load.
 */

async function assertNoServerError(page: import("@playwright/test").Page, label: string) {
  const bodyText = await page.textContent("body");
  expect(bodyText, `${label}: page rendered a server error`).not.toContain("Application error");
}

test("no page throws a server-side exception through the main flows", async ({ page }) => {
  test.setTimeout(180_000);
  const email = `verify-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Verify Bot");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("GoodPassword1");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/onboarding/, { timeout: 15000 });
  await page.getByText("Skip setup").click();
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await assertNoServerError(page, "dashboard");

  // Categories — create a custom one, reload (renders its ConfirmDeleteButton).
  await page.goto("/categories");
  await assertNoServerError(page, "categories (before)");
  await page.getByRole("button", { name: "+ New category" }).click();
  await page.getByLabel("Name").fill("Verify Category");
  await page.getByRole("button", { name: "Create category" }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "categories (after, with delete button rendered)");

  // Transactions — add an expense, reload.
  await page.goto("/transactions");
  await page.getByRole("button", { name: "+ Add transaction" }).click();
  await page.getByLabel("Amount (USD)").fill("12.34");
  await page.getByLabel("Merchant").fill("Verify Merchant");
  await page.getByRole("button", { name: "Add transaction", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "transactions (with delete button rendered)");

  // Budgets — this is the flow that actually crashed in production.
  await page.goto("/budgets");
  await assertNoServerError(page, "budgets (before)");
  await page.getByRole("button", { name: /Create budget|Edit budget/ }).click();
  await page.locator("select").first().selectOption({ index: 0 });
  await page.locator('input[placeholder="0.00"]').first().fill("100");
  await page.getByRole("button", { name: "Save budget" }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "budgets (after save, with delete-budget button rendered)");

  // Savings goals
  await page.goto("/savings-goals");
  await assertNoServerError(page, "savings-goals");

  // Accounts — add a manual investment account, then a holding, to exercise HoldingsTable's delete button.
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add account" }).click();
  await page.getByLabel("Name").fill("Verify Brokerage");
  await page.getByLabel("Type").selectOption("INVESTMENT");
  await page.getByLabel("Current balance (USD)").fill("1000");
  await page.getByRole("button", { name: "Add account", exact: true }).click();
  await page.waitForTimeout(1000);
  await assertNoServerError(page, "accounts (after add)");

  await page.goto("/investments");
  await page.getByRole("button", { name: "+ Add holding" }).click();
  await page.getByLabel("Security name").fill("Verify Stock");
  await page.getByLabel("Quantity").fill("10");
  await page.getByLabel("Current value (USD)").fill("500");
  await page.getByRole("button", { name: "Add holding", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "investments (with delete-holding button rendered)");

  // Household — create one, add a shared expense (self-split), open detail page.
  await page.goto("/household");
  await page.getByRole("button", { name: "+ New household" }).click();
  await page.getByLabel("Name").fill("Verify Household");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByText("Verify Household").click();
  await page.waitForURL(/household\/.+/, { timeout: 15000 });
  await assertNoServerError(page, "household detail (before expense)");

  await page.getByRole("button", { name: "+ Add shared expense" }).click();
  await page.getByLabel("Description").fill("Verify Expense");
  await page.getByLabel("Total amount (USD)").fill("20");
  await page.getByRole("button", { name: "Split evenly" }).click();
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "household detail (with delete-expense button rendered)");

  // Recurring, reports, tools, settings — just confirm they render.
  for (const path of ["/recurring", "/reports", "/tools", "/settings"]) {
    await page.goto(path);
    await assertNoServerError(page, path);
  }
});
