import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { WorkerProfile } from "@/domain/models";
import { adjacentSteps, stepStatus, type ProfileStep } from "@/domain/profile-steps";
import { getOwnProfile } from "@/lib/data/dashboard";
import { getCategories, getCities } from "@/lib/data/public";
import { PortfolioManager } from "../portfolio-manager";
import { ServiceManager } from "../service-manager";
import { EditorShell } from "./editor-shell";
import { ProfileFieldsStep } from "./profile-fields-step";
import { ReviewStep } from "./review-step";
import { StepFooter } from "./step-footer";

/** Server entry points for the step routes under /dashboard/profile/*. */

/** Each step gets its own document title, so the browser tab and history tell the steps apart. */
export async function stepMetadata(step: ProfileStep): Promise<Metadata> {
  const t = await getTranslations("dashboard.editor");
  return { title: `${t(`steps.${step}.title`)} · ${t("title")}` };
}

export async function FieldsStepPage({ step }: { step: "basics" | "area" | "contacts" }) {
  const [{ profile }, categories, cities] = await Promise.all([
    getOwnProfile(),
    step === "area" ? getCategories() : [],
    step === "area" ? getCities() : [],
  ]);
  const { prev, next } = adjacentSteps(step);
  return (
    <EditorShell step={step} profile={profile}>
      <ProfileFieldsStep
        step={step}
        profile={profile}
        categories={categories}
        cities={cities}
        prev={prev}
        next={next!}
        canSkip={stepStatus(profile, step) !== "done"}
      />
    </EditorShell>
  );
}

/** Services and photos save as you go, so their footer only moves between steps. */
async function InstantStep({ step, profile, children }: { step: "services" | "portfolio"; profile: WorkerProfile; children: ReactNode }) {
  const t = await getTranslations("dashboard.editor");
  const { prev, next } = adjacentSteps(step);
  return (
    <EditorShell step={step} profile={profile}>
      <div className="grid gap-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck className="size-4 shrink-0 text-success" /> {t("savesInstantly")}
        </p>
        {children}
        <StepFooter prev={prev} next={next} canSkip={stepStatus(profile, step) !== "done"} mode="continue" />
      </div>
    </EditorShell>
  );
}

export async function ServicesStepPage() {
  const [{ profile }, categories] = await Promise.all([getOwnProfile(), getCategories()]);
  return (
    <InstantStep step="services" profile={profile}>
      <ServiceManager services={profile.services} categories={categories} defaultCategoryId={profile.categories[0]?.id ?? null} />
    </InstantStep>
  );
}

export async function PortfolioStepPage() {
  const { profile } = await getOwnProfile();
  return (
    <InstantStep step="portfolio" profile={profile}>
      <PortfolioManager userId={profile.id} images={profile.portfolio} />
    </InstantStep>
  );
}

export async function ReviewStepPage() {
  const { profile } = await getOwnProfile();
  return (
    <EditorShell step="review" profile={profile}>
      <ReviewStep profile={profile} />
    </EditorShell>
  );
}
