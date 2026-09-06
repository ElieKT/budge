import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/nav/AppShell";
import { generateDueTransactionsForUser } from "@/server/recurring-runner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const preference = await prisma.userPreference.findUnique({ where: { userId: session.user.id } });
  if (!preference?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  // Opportunistically materialize any recurring transactions that came due
  // since this user's last visit. See src/server/recurring-runner.ts and
  // the README for why a scheduled job is still recommended in production.
  await generateDueTransactionsForUser(session.user.id);

  return <AppShell userName={session.user.name ?? session.user.email ?? "Account"}>{children}</AppShell>;
}
