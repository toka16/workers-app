import { ExternalLink, Eye, EyeOff, Rocket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { WorkerProfile } from "@/domain/models";
import { missingForPublish } from "@/domain/profile";
import { PROFILE_STEPS, stepForItem, stepHref } from "@/domain/profile-steps";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { PublishToggle } from "../publish-toggle";
import { StatusBadge } from "../status-badge";
import { GuardedLink } from "./editor-guard";

/**
 * Answers "can clients see my profile, and what happens when I save?" on every editing screen:
 * live (saves go public right away), ready to publish, or hidden with the steps still required.
 */
export async function PublishStatusBanner({ profile }: { profile: WorkerProfile }) {
  const t = await getTranslations("dashboard");
  const missing = new Set(missingForPublish(profile).map(stepForItem));
  const missingSteps = PROFILE_STEPS.filter((step) => missing.has(step));
  const state = profile.isPublished ? "live" : missingSteps.length === 0 ? "ready" : "hidden";

  const style = {
    live: { box: "border-success/30 bg-success-soft", icon: "bg-success text-success-foreground", Icon: Eye },
    ready: { box: "border-accent/40 bg-accent-soft", icon: "bg-accent text-accent-foreground", Icon: Rocket },
    hidden: { box: "border-border bg-surface", icon: "bg-muted text-muted-foreground", Icon: EyeOff },
  }[state];

  return (
    <div className={cn("mb-6 flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-soft sm:p-5", style.box)}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", style.icon)}>
        <style.Icon className="size-5" />
      </span>
      <div className="grid min-w-0 flex-1 basis-60 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold">{t(`editor.status.${state}Title`)}</h2>
          <StatusBadge live={profile.isPublished} className={cn(profile.isPublished && "bg-surface")}>
            {profile.isPublished ? t("editor.status.live") : t("editor.status.hidden")}
          </StatusBadge>
        </div>
        <p className="text-sm text-muted-foreground">{t(`editor.status.${state}Text`)}</p>
        {state === "hidden" && (
          <ul className="mt-1 flex flex-wrap gap-2">
            {missingSteps.map((step) => (
              <li key={step}>
                <GuardedLink
                  href={stepHref(step)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                  {t(`editor.steps.${step}.title`)}
                </GuardedLink>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {state === "live" && (
          <Button asChild variant="outline" size="md">
            <Link href={`/workers/${profile.slug}`} target="_blank">
              <ExternalLink /> {t("nav.viewPublic")}
            </Link>
          </Button>
        )}
        {state === "ready" && <PublishToggle published={false} canPublish size="md" />}
        {state === "hidden" && (
          <Button asChild variant="ghost" size="md">
            <Link href="/dashboard/preview">
              <Eye /> {t("nav.preview")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
