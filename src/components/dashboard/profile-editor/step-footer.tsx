"use client";

import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { stepHref, type ProfileStep } from "@/domain/profile-steps";
import { cn } from "@/lib/utils";
import { useEditorGuard } from "./editor-guard";

interface Props {
  prev: ProfileStep | null;
  next: ProfileStep | null;
  /** Offer "Skip for now" while the step still has something missing. */
  canSkip: boolean;
  /**
   * "submit": the step is a form; the main button saves and continues.
   * "continue": the step saves on its own; the main button only moves on (shown once the step is done).
   */
  mode: "submit" | "continue";
  submitting?: boolean;
  /** Replaces the main button (the review step puts the publish control here). */
  action?: ReactNode;
}

/** Phones get compact buttons so Back, Skip and the main action fit one row, even with Georgian labels. */
const COMPACT = "max-sm:h-11 max-sm:px-3 max-sm:text-sm";

/** Sticky bar that keeps the step actions reachable on long forms and small screens. */
export function StepFooter({ prev, next, canSkip, mode, submitting = false, action }: Props) {
  const t = useTranslations("dashboard.editor");
  const guard = useEditorGuard();
  const go = (step: ProfileStep) => guard?.navigate(stepHref(step));

  const main =
    action ??
    (mode === "submit" ? (
      <Button type="submit" size="lg" disabled={submitting} className={cn("flex-1 sm:flex-none", COMPACT)}>
        {submitting && <LoaderCircle className="animate-spin" />}
        {t("saveContinue")}
        {!submitting && <ArrowRight className="max-sm:hidden" />}
      </Button>
    ) : (
      next &&
      !canSkip && (
        <Button type="button" size="lg" onClick={() => go(next)} className={cn("flex-1 sm:flex-none", COMPACT)}>
          {t("continue")} <ArrowRight />
        </Button>
      )
    ));

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-lift">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {prev && (
          <Button type="button" variant="ghost" size="lg" onClick={() => go(prev)} className={cn("px-3 sm:px-4", COMPACT)}>
            <ArrowLeft /> <span className="max-sm:sr-only">{t("back")}</span>
          </Button>
        )}
        {guard?.dirty && (
          <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:inline-flex">
            <span className="size-2 rounded-full bg-warning" aria-hidden />
            {t("unsaved")}
          </span>
        )}
        <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none sm:gap-3">
          {canSkip && next && (
            <Button
              type="button"
              variant={mode === "continue" ? "outline" : "ghost"}
              size="lg"
              onClick={() => go(next)}
              className={cn(mode === "continue" && !action && "flex-1 sm:flex-none", COMPACT)}
            >
              <span className="sm:hidden">{t("skipShort")}</span>
              <span className="max-sm:hidden">{t("skip")}</span>
            </Button>
          )}
          {main}
        </div>
      </div>
    </div>
  );
}
