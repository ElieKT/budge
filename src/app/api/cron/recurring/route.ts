import { NextResponse } from "next/server";
import { generateDueTransactionsForAllUsers } from "@/server/recurring-runner";

/**
 * Materializes every user's due recurring transactions. Intended to be
 * called by an external scheduler (Vercel Cron, GitHub Actions, a
 * cron-job.org ping, etc.) — see README "Recurring transactions". The
 * app also runs this per-user on login (src/app/(app)/layout.tsx), but
 * that alone won't fire for a user who doesn't visit for a while, so this
 * endpoint is the mechanism that keeps recurring transactions on schedule
 * for everyone regardless of when they last logged in.
 *
 * Authenticated with a static bearer token rather than a user session,
 * since the caller is a scheduler, not a browser.
 */
async function handle(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured on the server." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateDueTransactionsForAllUsers();
  return NextResponse.json({ ok: true, ...result });
}

// Vercel Cron only issues GET requests (and auto-attaches the Authorization
// header when CRON_SECRET is set as a project env var); POST is supported
// too for other schedulers (GitHub Actions, cron-job.org) that can send it.
export const GET = handle;
export const POST = handle;
