import { Eye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getOwnProfile } from "@/lib/data/dashboard";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

/** Header status on every dashboard page: is the profile visible to clients right now? */
export async function ProfileStatusPill() {
  const [{ profile }, t] = await Promise.all([getOwnProfile(), getTranslations("dashboard")]);
  const live = profile.isPublished;
  const status = live ? t("editor.status.live") : t("editor.status.hidden");
  return (
    <>
      <Link
        href="/dashboard/profile/review"
        aria-label={t("editor.status.statusLabel", { status })}
        className="group inline-flex rounded-full"
      >
        <StatusBadge
          live={live}
          size="md"
          className={cn(
            "h-9 px-3 transition-colors",
            live ? "group-hover:border-success/60" : "group-hover:text-foreground",
          )}
        >
          {status}
        </StatusBadge>
      </Link>
      {/* Drafts aren't public yet, so the owner gets the preview instead. */}
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href={live ? `/workers/${profile.slug}` : "/dashboard/preview"} target={live ? "_blank" : undefined}>
          <Eye /> {live ? t("nav.viewPublic") : t("nav.preview")}
        </Link>
      </Button>
    </>
  );
}
