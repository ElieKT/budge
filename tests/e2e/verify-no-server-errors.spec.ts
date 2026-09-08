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
  page.on("dialog", (dialog) => dialog.accept());
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(`[${page.url()}] ${err.message}`));
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

  // Transactions — add an expense with a receipt photo attached, reload.
  await page.goto("/transactions");
  await page.getByRole("button", { name: "+ Add transaction" }).click();
  await page.getByLabel("Amount (USD)").fill("12.34");
  await page.getByLabel("Date").fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel("Merchant").fill("Verify Merchant");
  await page.locator('input[name="receipt"]').setInputFiles(
    "C:/Users/eliet/AppData/Local/Temp/claude/C--Users-eliet/8cd5be36-9c71-4307-98bb-32642aea61ef/scratchpad/test-receipt.png",
  );
  await expect(page.getByAltText("Receipt preview")).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Add transaction", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "transactions (with delete button rendered)");
  await expect(page.getByTitle("View receipt")).toBeVisible();

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

  // Budget templates — apply one to a different month so it doesn't clobber the manual test above.
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const templateMonth = nextMonthDate.getMonth() + 1;
  const templateYear = nextMonthDate.getFullYear();
  await page.goto(`/budgets?month=${templateMonth}&year=${templateYear}`);
  await page.getByRole("button", { name: "Use a template" }).click();
  await page.getByLabel("Monthly income (USD)").fill("4000");
  await expect(page.getByText("Housing").first()).toBeVisible();
  await page.getByRole("button", { name: "Apply template" }).click();
  await expect(page.getByRole("button", { name: "Apply template" })).not.toBeVisible({ timeout: 15000 });
  // A bulk template write followed immediately by a reload can occasionally
  // race Neon's pooled connection on read-after-write; a short settle avoids
  // that (confirmed independently — the write itself is never lost).
  await page.waitForTimeout(2000);
  await page.reload();
  await assertNoServerError(page, "budgets (after applying a template)");
  await expect(page.getByText("Housing").first()).toBeVisible({ timeout: 15000 });

  // A life-event template, in yet another month, to confirm its custom bucket weights work too.
  const twoMonthsOut = new Date();
  twoMonthsOut.setMonth(twoMonthsOut.getMonth() + 2);
  await page.goto(`/budgets?month=${twoMonthsOut.getMonth() + 1}&year=${twoMonthsOut.getFullYear()}`);
  await page.getByRole("button", { name: "Use a template" }).click();
  await page.getByText("Growing Family / New Baby").click();
  await page.getByLabel("Monthly income (USD)").fill("5000");
  await expect(page.getByText("Childcare").first()).toBeVisible();
  await page.getByRole("button", { name: "Apply template" }).click();
  await expect(page.getByRole("button", { name: "Apply template" })).not.toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.reload();
  await assertNoServerError(page, "budgets (after applying a life-event template)");
  await expect(page.getByText("Childcare").first()).toBeVisible({ timeout: 15000 });

  // Savings goals — create one, then verify the shareable progress image renders.
  await page.goto("/savings-goals");
  await assertNoServerError(page, "savings-goals (before)");
  await page.getByRole("button", { name: "+ New goal" }).click();
  await page.getByLabel("Goal name").fill("Verify Emergency Fund");
  await page.getByLabel("Target amount (USD)").fill("1000");
  await page.getByRole("button", { name: "Create goal" }).click();
  await page.waitForTimeout(1000);
  await assertNoServerError(page, "savings-goals (after create)");

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByLabel("Hide exact dollar amounts (show percentage only)").check();
  await page.getByRole("button", { name: "Download image" }).click();
  // Both the modal's icon "✕" and the secondary button share the accessible name "Close" —
  // getByText matches only the secondary button's actual text content, not the icon's aria-label.
  await page.getByText("Close", { exact: true }).click();

  // Privacy mode — toggle it on and confirm the class actually lands on <html>.
  // (Both the desktop sidebar and mobile top bar render their own toggle; only one is visible per viewport.)
  await page.getByTitle("Privacy mode off — click to blur amounts").first().click();
  await expect(page.locator("html")).toHaveClass(/privacy-mode/);
  await page.getByTitle("Privacy mode on — click to show amounts").first().click();
  await expect(page.locator("html")).not.toHaveClass(/privacy-mode/);

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

  // Leaving as the sole member deletes the household and redirects safely.
  await page.getByRole("button", { name: "Leave" }).click();
  await page.waitForURL(/\/household$/, { timeout: 15000 });
  await assertNoServerError(page, "household list (after leaving/deleting the sole-member household)");
  await expect(page.getByText("Verify Household")).not.toBeVisible();

  // Debt payoff planner — add a debt, verify the calculator computes a plan.
  await page.goto("/debt-payoff");
  await assertNoServerError(page, "debt-payoff (before)");
  await page.getByRole("button", { name: "+ Add debt" }).click();
  await page.getByLabel("Debt name").fill("Verify Card");
  await page.getByLabel("Balance owed (USD)").fill("2000");
  await page.getByLabel("APR (%)").fill("22");
  await page.getByLabel("Minimum monthly payment (USD)").fill("100");
  await page.getByRole("button", { name: "Add debt", exact: true }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "debt-payoff (after add, with delete button rendered)");
  await expect(page.getByText("Verify Card").first()).toBeVisible();
  await expect(page.getByText("Debt-free in")).toBeVisible();
  await expect(page.getByText("Total interest paid")).toBeVisible();

  // Recurring — add a subscription-like expense, then verify it surfaces on the Subscriptions radar.
  await page.goto("/recurring");
  await assertNoServerError(page, "recurring (before)");
  await page.getByRole("button", { name: "+ New recurring transaction" }).click();
  await page.getByLabel("Amount (USD)").fill("15.99");
  await page.getByLabel("Merchant").fill("Verify Streaming Co");
  await page.getByRole("button", { name: "Create recurring transaction" }).click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "recurring (after add)");

  await page.goto("/subscriptions");
  await assertNoServerError(page, "subscriptions (before review)");
  await expect(page.getByText("Verify Streaming Co")).toBeVisible();
  await page.getByRole("button", { name: "Reviewed" }).first().click();
  await page.waitForTimeout(1000);
  await page.reload();
  await assertNoServerError(page, "subscriptions (after review)");
  await expect(page.getByText("Verify Streaming Co")).toBeVisible();

  // Reports, tools, settings, and the new static pages — just confirm they render.
  for (const path of ["/reports", "/tools", "/settings", "/security", "/changelog"]) {
    await page.goto(path);
    await assertNoServerError(page, path);
  }

  expect(pageErrors, `uncaught client-side errors: ${pageErrors.join("; ")}`).toEqual([]);
});
