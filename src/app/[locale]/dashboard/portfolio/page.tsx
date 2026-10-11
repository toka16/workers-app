import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { getOwnProfile } from "@/lib/data/dashboard";

export default async function PortfolioPage() {
  const [{ profile }, t] = await Promise.all([getOwnProfile(), getTranslations("dashboard.portfolio")]);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <PortfolioManager userId={profile.id} images={profile.portfolio} />
    </>
  );
}
