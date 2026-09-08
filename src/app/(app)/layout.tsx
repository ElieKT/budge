import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/nav/AppShell";
import { generateDueTransactionsForUser } from "@/server/recurring-runner";
import { NAV_ITEMS, MOBILE_NAV_ITEMS } from "@/components/nav/nav-items";
import { t, translateNavItems, type Locale } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, preference] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } }),
    prisma.userPreference.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!preference?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  // Opportunistically materialize any recurring transactions that came due
  // since this user's last visit. See src/server/recurring-runner.ts and
  // the README for why a scheduled job is still recommended in production.
  await generateDueTransactionsForUser(session.user.id);

  const locale: Locale = preference.locale;

  return (
    <AppShell
      userName={session.user.name ?? session.user.email ?? "Account"}
      userImage={user?.image}
      navItems={translateNavItems(locale, NAV_ITEMS)}
      mobileNavItems={translateNavItems(locale, MOBILE_NAV_ITEMS)}
      signOutLabel={t(locale, "sign_out")}
      isAdmin={session.user.role === "ADMIN"}
    >
      {children}
    </AppShell>
  );
}
