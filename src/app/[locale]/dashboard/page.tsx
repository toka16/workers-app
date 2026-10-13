import { ArrowRight, Briefcase, Check, Images, Pencil, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { PublishStatusBanner } from "@/components/dashboard/profile-editor/publish-status-banner";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completenessPercent, profileChecklist, type CompletenessItem } from "@/domain/profile";
import { firstIncompleteStep, stepForItem, stepHref } from "@/domain/profile-steps";
import { Link } from "@/i18n/navigation";
import { getOwnProfile } from "@/lib/data/dashboard";
import { cn } from "@/lib/utils";

export default async function DashboardOverview() {
  const [{ profile }, t] = await Promise.all([getOwnProfile(), getTranslations("dashboard")]);
  const checklist = profileChecklist(profile);
  const nextStep = firstIncompleteStep(profile);
  const percent = completenessPercent(profile);
  const firstName = profile.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? t("greeting", { name: firstName }) : t("greetingFallback")}
        subtitle={t("overviewSubtitle")}
      />

      <PublishStatusBanner profile={profile} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
            <Avatar name={profile.fullName || "?"} src={profile.avatar?.url} className="size-16 text-xl" />
            <div className="grid min-w-0 flex-1 gap-1">
              <h2 className="truncate text-xl font-bold">{profile.fullName || "—"}</h2>
              <p className="truncate text-sm text-muted-foreground">{profile.headline || t("checklist.headline")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/40 px-5 py-4 sm:px-6">
            {nextStep === "review" ? (
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard/profile/basics">
                  <Pencil /> {t("editor.editProfile")}
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href={stepHref(nextStep)}>
                  {t("editor.continueSetup")} <ArrowRight />
                </Link>
              </Button>
            )}
            {nextStep !== "review" && (
              <span className="text-sm text-muted-foreground">{t("editor.nextStep", { step: t(`editor.steps.${nextStep}.title`) })}</span>
            )}
            {profile.isPublished && <PublishToggle published canPublish className="ml-auto" size="md" />}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{t("completeness")}</CardTitle>
              <span className="font-display text-2xl font-extrabold text-primary">{percent}%</span>
            </div>
            <Progress value={percent} />
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1">
              {(Object.keys(checklist) as CompletenessItem[]).map((item) => (
                <li key={item}>
                  <Link
                    href={stepHref(stepForItem(item))}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted",
                      checklist[item] && "text-muted-foreground line-through decoration-muted-foreground/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border",
                        checklist[item] ? "border-success bg-success text-success-foreground" : "border-input-border",
                      )}
                    >
                      {checklist[item] && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {t(`checklist.${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-bold">{t("quickLinks")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: stepHref("basics"), icon: UserRound, label: t("editor.steps.basics.title"), meta: profile.headline || "—" },
          { href: stepHref("services"), icon: Briefcase, label: t("editor.steps.services.title"), meta: t("editor.review.services", { count: profile.services.length }) },
          { href: stepHref("portfolio"), icon: Images, label: t("editor.steps.portfolio.title"), meta: t("editor.review.photos", { count: profile.portfolio.length }) },
        ].map(({ href, icon: Icon, label, meta }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>
            <span className="grid min-w-0 flex-1">
              <span className="font-semibold">{label}</span>
              <span className="truncate text-sm text-muted-foreground">{meta}</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </>
  );
}
