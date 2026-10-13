import { getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui/alert";
import { WorkerProfileView } from "@/components/workers/worker-profile-view";
import { getOwnProfile } from "@/lib/data/dashboard";
import { getCategories } from "@/lib/data/public";

/** Lets a worker see their page exactly as visitors will, even while it's still a draft. */
export default async function PreviewPage() {
  const [{ profile }, categories, t] = await Promise.all([getOwnProfile(), getCategories(), getTranslations("profile")]);
  return (
    <div className="-mx-4 overflow-hidden bg-background sm:mx-0 sm:rounded-2xl sm:border sm:border-border">
      {!profile.isPublished && <Alert className="m-4">{t("previewBanner")}</Alert>}
      <WorkerProfileView worker={profile} categories={categories} preview />
    </div>
  );
}
