"use client";

import { useEffect } from "react";

/** The step shown before the current one, kept across the client-side navigations between steps. */
let previousStep: string | null = null;

/**
 * Moves focus to the step heading when the user goes to another step, so keyboard and screen reader
 * users start reading at the new step instead of wherever focus was left. Not on the first page load.
 */
export function StepHeadingFocus({ step }: { step: string }) {
  useEffect(() => {
    if (previousStep !== null && previousStep !== step) {
      document.getElementById("step-title")?.focus({ preventScroll: true });
    }
    previousStep = step;
  }, [step]);
  return null;
}
