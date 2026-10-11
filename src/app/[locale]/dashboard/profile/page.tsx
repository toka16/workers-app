import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getOwnProfile } from "@/lib/data/dashboard";
import { getCategories, getCities } from "@/lib/data/public";
import { siteUrl } from "@/lib/site";

export default async function ProfilePage() {
  const [{ profile }, categories, cities, t, locale] = await Promise.all([
    getOwnProfile(),
    getCategories(),
    getCities(),
    getTranslations("dashboard.profile"),
    getLocale(),
  ]);
  const profileUrl = `${siteUrl()}${locale === "ka" ? "" : `/${locale}`}/workers/${profile.slug}`;
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {/* key: reset the form when the saved profile changes */}
      <ProfileForm key={profile.updatedAt} profile={profile} profileUrl={profileUrl} categories={categories} cities={cities} />
    </>
  );
}
