import { Check, Eye, PartyPopper, Pencil, Rocket, TriangleAlert } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LocalizedText, WorkerProfile } from "@/domain/models";
import { completenessPercent, missingForPublish } from "@/domain/profile";
import { OPTIONAL_STEPS, PROFILE_STEPS, stepHref, stepStatus, type ProfileStep } from "@/domain/profile-steps";
import { localized } from "@/i18n/localized";
import { Link } from "@/i18n/navigation";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PublishToggle } from "../publish-toggle";
import { GuardedLink } from "./editor-guard";
import { ProfileLink } from "./profile-link";
import { StepFooter } from "./step-footer";

const CONTACT_LABELS = {
  phone: "phone",
  whatsapp: "whatsapp",
  viber: "viber",
  telegram: "telegram",
  email: "contactEmail",
  facebook: "facebook",
  website: "website",
} as const;

/** Last step: what's filled in, what's still missing, and the one place to publish or hide the profile. */
export async function ReviewStep({ profile }: { profile: WorkerProfile }) {
  const [t, tc, locale] = await Promise.all([getTranslations("dashboard"), getTranslations("common"), getLocale()]);
  const canPublish = missingForPublish(profile).length === 0;
  const percent = completenessPercent(profile);
  const profileUrl = `${siteUrl()}${locale === "ka" ? "" : `/${locale}`}/workers/${profile.slug}`;
  const names = (items: { name: LocalizedText }[]) => items.map((i) => localized(i.name, locale)).join(", ");

  const summary: Record<Exclude<ProfileStep, "review">, { main: string | null; sub?: string }> = {
    basics: { main: profile.fullName || null, sub: profile.headline || undefined },
    area: {
      main: profile.categories.length || profile.cities.length
        ? t("editor.review.areaSummary", { categories: profile.categories.length, cities: profile.cities.length })
        : null,
      sub: [names(profile.categories), names(profile.cities)].filter(Boolean).join(" · ") || undefined,
    },
    contacts: {
      main:
        (Object.keys(CONTACT_LABELS) as (keyof typeof CONTACT_LABELS)[])
          .filter((key) => profile.contacts[key])
          .map((key) => t(`profile.${CONTACT_LABELS[key]}`))
          .join(", ") || null,
    },
    services: { main: t("editor.review.services", { count: profile.services.length }) },
    portfolio: { main: t("editor.review.photos", { count: profile.portfolio.length }) },
  };

  const state = profile.isPublished ? "live" : canPublish ? "ready" : "missing";
  const hero = {
    live: { Icon: PartyPopper, box: "border-success/30 bg-success-soft", icon: "bg-success text-success-foreground" },
    ready: { Icon: Rocket, box: "border-accent/40 bg-accent-soft", icon: "bg-accent text-accent-foreground" },
    missing: { Icon: TriangleAlert, box: "border-border bg-surface", icon: "bg-muted text-muted-foreground" },
  }[state];

  return (
    <div className="grid gap-6">
      <div className={cn("grid gap-4 rounded-2xl border p-5 shadow-soft sm:p-6", hero.box)}>
        <div className="flex items-start gap-4">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", hero.icon)}>
            <hero.Icon className="size-5" />
          </span>
          <div className="grid gap-1">
            <h3 className="text-lg font-bold">{t(`editor.review.${state}Title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`editor.review.${state}Text`)}</p>
          </div>
        </div>
        {state === "live" && (
          <div className="grid gap-2">
            <span className="text-sm font-medium">{t("editor.review.profileAddress")}</span>
            <ProfileLink url={profileUrl} slug={profile.slug} />
          </div>
        )}
      </div>

      <Card className="divide-y divide-border">
        {PROFILE_STEPS.filter((step) => step !== "review").map((step) => {
          const status = stepStatus(profile, step);
          const { main, sub } = summary[step];
          return (
            <div key={step} className="flex items-center gap-4 p-4 sm:px-6">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border",
                  status === "done"
                    ? "border-success bg-success text-success-foreground"
                    : status === "required"
                      ? "border-warning bg-warning-soft"
                      : "border-input-border",
                )}
              >
                {status === "done" && <Check className="size-3.5" strokeWidth={3} />}
                {status === "required" && <span className="size-2 rounded-full bg-warning" />}
              </span>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                  {t(`editor.steps.${step}.title`)}
                  {status === "required" && <span className="text-xs font-medium text-warning-strong">{t("editor.required")}</span>}
                  {status !== "done" && OPTIONAL_STEPS.includes(step) && (
                    <span className="text-xs font-normal text-muted-foreground">{t("editor.optional")}</span>
                  )}
                </p>
                <p className={cn("truncate text-sm", main ? "text-foreground/80" : "text-muted-foreground italic")}>
                  {main ?? t("editor.review.notFilled")}
                </p>
                {sub && <p className="truncate text-sm text-muted-foreground">{sub}</p>}
              </div>
              <Button asChild variant={status === "required" ? "secondary" : "ghost"} size="sm">
                <GuardedLink href={stepHref(step)}>
                  <Pencil /> <span className="max-sm:sr-only">{tc("edit")}</span>
                  <span className="sr-only">: {t(`editor.steps.${step}.title`)}</span>
                </GuardedLink>
              </Button>
            </div>
          );
        })}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="grid content-start gap-3 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{t("completeness")}</h3>
            <span className="font-display text-2xl font-extrabold text-primary">{percent}%</span>
          </div>
          <Progress value={percent} />
        </Card>
        <Card className="grid content-start gap-3 p-5 sm:p-6">
          <h3 className="font-bold">{t("editor.review.preview")}</h3>
          <p className="text-sm text-muted-foreground">{t("editor.review.previewHint")}</p>
          <Button asChild variant="outline" className="justify-self-start">
            <Link href="/dashboard/preview">
              <Eye /> {t("editor.review.preview")}
            </Link>
          </Button>
        </Card>
      </div>

      <StepFooter
        prev="portfolio"
        next={null}
        canSkip={false}
        mode="continue"
        action={<PublishToggle published={profile.isPublished} canPublish={canPublish} className="flex-1 sm:flex-none" />}
      />
    </div>
  );
}
