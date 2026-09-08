import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/Misc";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { PreferencesForm } from "@/components/settings/PreferencesForm";
import { AvatarUploadForm } from "@/components/settings/AvatarUploadForm";
import { AppearanceForm } from "@/components/settings/AppearanceForm";
import { LocaleForm } from "@/components/settings/LocaleForm";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { preference: true },
  });

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, preferences, and account" />

      <div className="space-y-6">
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Profile</h2>
          <div className="mb-6">
            <AvatarUploadForm name={user.name ?? user.email} image={user.image} />
          </div>
          <ProfileForm name={user.name ?? ""} email={user.email} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Appearance</h2>
          <AppearanceForm theme={user.preference?.theme ?? "SYSTEM"} accentColor={user.preference?.accentColor ?? "#159d63"} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Language</h2>
          <LocaleForm locale={user.preference?.locale ?? "EN"} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Preferences</h2>
          <PreferencesForm
            currency={user.preference?.currency ?? "USD"}
            monthlyIncomeEstimate={
              user.preference?.monthlyIncomeEstimate ? (user.preference.monthlyIncomeEstimate / 100).toFixed(2) : ""
            }
          />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Password</h2>
          <ChangePasswordForm />
        </section>

        <DeleteAccountSection />
      </div>
    </div>
  );
}
