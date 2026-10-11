import { slugify } from "@/lib/slugify";
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

/** Placeholder address given at sign-up (see handle_new_user in the migrations). */
const DEFAULT_SLUG = /^worker-[0-9a-f]{10}$/;

/**
 * Profile addresses are generated, not edited: the sign-up placeholder is replaced by one based on the
 * worker's name the first time they save a name, and stays fixed afterwards so shared links keep working.
 * Returns the addresses to try in order (later ones are fallbacks when an address is taken).
 */
export function slugCandidates(profile: Pick<WorkerProfile, "id" | "slug">, fullName: string): string[] {
  if (!DEFAULT_SLUG.test(profile.slug)) return [profile.slug];
  const base = slugify(fullName);
  if (base.length < 3) return [profile.slug];
  return [base, `${base}-${profile.id.replace(/-/g, "").slice(0, 4)}`, profile.slug];
}
