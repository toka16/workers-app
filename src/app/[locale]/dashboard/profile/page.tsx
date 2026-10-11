import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getOwnProfile } from "@/lib/data/dashboard";
import { getCategories, getCities } from "@/lib/data/public";

export default async function ProfilePage() {
  const [{ profile }, categories, cities, t] = await Promise.all([
    getOwnProfile(),
    getCategories(),
    getCities(),
    getTranslations("dashboard.profile"),
  ]);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {/* key: reset the form when the saved profile changes */}
      <ProfileForm key={profile.updatedAt} profile={profile} categories={categories} cities={cities} />
    </>
  );
}
