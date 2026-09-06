import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end config for the main user journey (register -> onboarding ->
 * add a budget -> add a transaction -> see the dashboard update). Requires
 * a running app pointed at a real Postgres database — see README
 * "Testing" for why this suite was written but not executed in this
 * environment (no provisioned database was available).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
