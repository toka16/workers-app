import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { WorkerProfile } from "@/domain/models";
import { PROFILE_STEPS, stepStatus, type ProfileStep, type StepStatus } from "@/domain/profile-steps";
import { PageHeader } from "../page-header";
import { StepHeadingFocus } from "./step-heading-focus";
import { ProfileStepper } from "./profile-stepper";
import { PublishStatusBanner } from "./publish-status-banner";

/** Frame shared by every step: publish status, the stepper and the step's heading. */
export async function EditorShell({ step, profile, children }: { step: ProfileStep; profile: WorkerProfile; children: ReactNode }) {
  const t = await getTranslations("dashboard.editor");
  const statuses = Object.fromEntries(PROFILE_STEPS.map((s) => [s, stepStatus(profile, s)])) as Record<ProfileStep, StepStatus>;

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {/* The review step shows the status itself, next to the publish controls. */}
      {step !== "review" && <PublishStatusBanner profile={profile} />}
      <ProfileStepper current={step} statuses={statuses} />
      <section aria-labelledby="step-title">
        <div className="mb-5 grid gap-1">
          <p className="text-sm font-semibold text-primary">
            {t("stepOf", { current: PROFILE_STEPS.indexOf(step) + 1, total: PROFILE_STEPS.length })}
          </p>
          <h2 id="step-title" tabIndex={-1} className="text-xl font-bold outline-none sm:text-2xl">
            {t(`steps.${step}.title`)}
          </h2>
          <StepHeadingFocus step={step} />
          <p className="text-muted-foreground">{t(`steps.${step}.description`)}</p>
        </div>
        {children}
      </section>
    </>
  );
}
