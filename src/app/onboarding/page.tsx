import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCategoriesForUser } from "@/server/data/categories";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const preference = await prisma.userPreference.findUnique({ where: { userId: session.user.id } });
  if (preference?.onboardingCompletedAt) redirect("/dashboard");

  const expenseCategories = await getCategoriesForUser(session.user.id, "EXPENSE");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="bg-gradient-to-r from-brand-400 to-teal-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            💰 Budge
          </span>
          <h1 className="mt-2 text-2xl">Let&apos;s set things up</h1>
          <p className="mt-1 text-sm text-slate-500">
            A few optional steps to get your budget started — skip anything you&apos;d rather do later.
          </p>
        </div>
        <OnboardingWizard expenseCategories={expenseCategories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </div>
  );
}
