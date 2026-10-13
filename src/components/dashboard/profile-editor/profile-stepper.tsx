"use client";

import { Check, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { OPTIONAL_STEPS, PROFILE_STEPS, stepHref, type ProfileStep, type StepStatus } from "@/domain/profile-steps";
import { cn } from "@/lib/utils";
import { GuardedLink } from "./editor-guard";

interface Props {
  current: ProfileStep;
  statuses: Record<ProfileStep, StepStatus>;
}

/**
 * Every step stays reachable: new workers follow the order, returning ones jump straight to what they need.
 * Wide screens get a classic numbered stepper; phones get a scrollable row of pills (long Georgian labels fit).
 */
export function ProfileStepper({ current, statuses }: Props) {
  const t = useTranslations("dashboard.editor");
  const row = useRef<HTMLOListElement>(null);

  // Keep the current pill in view on phones without scrolling the page vertically.
  useEffect(() => {
    const list = row.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (list && active) list.scrollLeft = active.offsetLeft - list.clientWidth / 2 + active.clientWidth / 2;
  }, [current]);

  const marker = (step: ProfileStep) => {
    if (statuses[step] === "done" || step === "review") return null;
    if (statuses[step] === "required") return { label: t("required"), dot: "bg-warning", required: true };
    if (OPTIONAL_STEPS.includes(step)) return { label: t("optional"), dot: "bg-muted-foreground/40", required: false };
    return null;
  };

  const srStatus = (step: ProfileStep) =>
    statuses[step] === "done" ? t("done") : statuses[step] === "required" ? t("required") : OPTIONAL_STEPS.includes(step) ? t("optional") : null;

  return (
    <nav aria-label={t("stepsLabel")} className="mb-8">
      {/* Phones and small tablets */}
      <ol ref={row} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto scroll-smooth px-4 md:hidden">
        {PROFILE_STEPS.map((step, i) => {
          const isCurrent = step === current;
          const done = statuses[step] === "done";
          const mark = marker(step);
          return (
            <li key={step} className="shrink-0">
              <GuardedLink
                href={stepHref(step)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-xs",
                    isCurrent ? "bg-primary-foreground text-primary" : done ? "bg-success text-success-foreground" : "bg-muted",
                  )}
                >
                  {done && !isCurrent ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                {t(`steps.${step}.short`)}
                {/* Required gets an icon, not just a coloured dot, so the state doesn't rely on colour alone. */}
                {mark && !isCurrent &&
                  (mark.required ? (
                    <CircleAlert className="size-3.5 text-warning" aria-hidden />
                  ) : (
                    <span className={cn("size-1.5 rounded-full", mark.dot)} aria-hidden />
                  ))}
                {srStatus(step) && <span className="sr-only">({srStatus(step)})</span>}
              </GuardedLink>
            </li>
          );
        })}
      </ol>

      {/* Tablets and up */}
      <ol className="hidden items-start md:flex">
        {PROFILE_STEPS.map((step, i) => {
          const isCurrent = step === current;
          const done = statuses[step] === "done";
          const mark = marker(step);
          return (
            <li key={step} className="relative flex-1">
              {i < PROFILE_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[1.125rem] right-[calc(-50%+1.5rem)] left-[calc(50%+1.5rem)] h-0.5 rounded-full",
                    done ? "bg-success" : "bg-border",
                  )}
                />
              )}
              <GuardedLink
                href={stepHref(step)}
                aria-current={isCurrent ? "step" : undefined}
                className="group mx-auto flex w-fit max-w-full flex-col items-center gap-2 rounded-xl px-1 text-center"
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full border-2 text-sm font-bold transition-all",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary-soft"
                      : done
                        ? "border-success bg-success text-success-foreground"
                        : "border-input-border bg-surface text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground",
                  )}
                >
                  {done && !isCurrent ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs leading-tight font-semibold",
                    isCurrent ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {t(`steps.${step}.short`)}
                </span>
                {mark && (
                  <span className="-mt-1 inline-flex items-center gap-1 text-xs leading-tight text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", mark.dot)} aria-hidden />
                    {mark.label}
                  </span>
                )}
                {done && <span className="sr-only">({t("done")})</span>}
              </GuardedLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
