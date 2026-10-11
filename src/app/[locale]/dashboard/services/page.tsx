import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceManager } from "@/components/dashboard/service-manager";
import { getOwnProfile } from "@/lib/data/dashboard";
import { getCategories } from "@/lib/data/public";

export default async function ServicesPage() {
  const [{ profile }, categories, t] = await Promise.all([getOwnProfile(), getCategories(), getTranslations("dashboard.services")]);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ServiceManager services={profile.services} categories={categories} defaultCategoryId={profile.categories[0]?.id ?? null} />
    </>
  );
}
