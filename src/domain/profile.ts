import type { WorkerProfile } from "./models";

export type CompletenessItem = "name" | "headline" | "avatar" | "contact" | "city" | "category" | "service" | "portfolio";

/** Items that must be present before a profile can be published (mirrors the DB trigger). */
export const REQUIRED_FOR_PUBLISH: CompletenessItem[] = ["name", "contact", "city", "category"];

export function hasAnyContact(profile: Pick<WorkerProfile, "contacts">): boolean {
  const c = profile.contacts;
  return Boolean(c.phone || c.whatsapp || c.viber || c.telegram || c.email || c.facebook);
}

export function profileChecklist(profile: WorkerProfile): Record<CompletenessItem, boolean> {
  return {
    name: profile.fullName.trim().length > 0,
    headline: profile.headline.trim().length > 0,
    avatar: profile.avatar !== null,
    contact: hasAnyContact(profile),
    city: profile.cities.length > 0,
    category: profile.categories.length > 0,
    service: profile.services.length > 0,
    portfolio: profile.portfolio.length > 0,
  };
}

export function completenessPercent(profile: WorkerProfile): number {
  const items = Object.values(profileChecklist(profile));
  return Math.round((items.filter(Boolean).length / items.length) * 100);
}

export function missingForPublish(profile: WorkerProfile): CompletenessItem[] {
  const checklist = profileChecklist(profile);
  return REQUIRED_FOR_PUBLISH.filter((item) => !checklist[item]);
}
