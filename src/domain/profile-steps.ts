import type { WorkerProfile } from "./models";
import { profileChecklist, REQUIRED_FOR_PUBLISH, type CompletenessItem } from "./profile";

/** The guided profile editor, in the order new workers walk through it. */
export const PROFILE_STEPS = ["basics", "area", "contacts", "services", "portfolio", "review"] as const;
export type ProfileStep = (typeof PROFILE_STEPS)[number];

/** Checklist items each step fills in; review only summarizes. */
const STEP_ITEMS: Record<ProfileStep, CompletenessItem[]> = {
  basics: ["name", "avatar", "headline"],
  area: ["category", "city"],
  contacts: ["contact"],
  services: ["service"],
  portfolio: ["portfolio"],
  review: [],
};

/** Steps that contain nothing required for publishing. */
export const OPTIONAL_STEPS: ProfileStep[] = PROFILE_STEPS.filter(
  (step) => step !== "review" && !STEP_ITEMS[step].some((item) => REQUIRED_FOR_PUBLISH.includes(item)),
);

/**
 * done: everything in the step is filled in.
 * required: something needed for publishing is missing.
 * todo: only recommended or optional items are missing.
 * The review step is done once the profile is published.
 */
export type StepStatus = "done" | "required" | "todo";

export function stepStatus(profile: WorkerProfile, step: ProfileStep): StepStatus {
  if (step === "review") return profile.isPublished ? "done" : "todo";
  const checklist = profileChecklist(profile);
  const missing = STEP_ITEMS[step].filter((item) => !checklist[item]);
  if (missing.length === 0) return "done";
  return missing.some((item) => REQUIRED_FOR_PUBLISH.includes(item)) ? "required" : "todo";
}

/** Where to resume editing: the first step that isn't complete, or the review once everything is. */
export function firstIncompleteStep(profile: WorkerProfile): ProfileStep {
  return PROFILE_STEPS.find((step) => step !== "review" && stepStatus(profile, step) !== "done") ?? "review";
}

export function stepForItem(item: CompletenessItem): ProfileStep {
  return PROFILE_STEPS.find((step) => STEP_ITEMS[step].includes(item))!;
}

export function stepHref(step: ProfileStep): `/dashboard/profile/${ProfileStep}` {
  return `/dashboard/profile/${step}`;
}

export function adjacentSteps(step: ProfileStep): { prev: ProfileStep | null; next: ProfileStep | null } {
  const i = PROFILE_STEPS.indexOf(step);
  return { prev: PROFILE_STEPS[i - 1] ?? null, next: PROFILE_STEPS[i + 1] ?? null };
}
