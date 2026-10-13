"use server";

import { updateTag } from "next/cache";
import { DomainError } from "@/domain/errors";
import { MAX_PORTFOLIO_IMAGES, MAX_SERVICES, STORAGE_BUCKETS, type Service } from "@/domain/models";
import { liveProfileErrors, slugCandidates } from "@/domain/profile";
import { captionSchema, changePasswordSchema, profileSchema, serviceSchema } from "@/domain/schemas";
import { getRepositories } from "@/infrastructure/container.server";
import { TAGS } from "@/lib/data/public";
import { fail, invalid, ok, type ActionResult } from "./result";

/** Every action re-authenticates on its own: never trust the client for authorization. */
async function authorized() {
  const repos = await getRepositories();
  const user = await repos.auth.getCurrentUser();
  if (!user) throw new DomainError("unauthorized");
  return { user, repos };
}

/** Public pages are cached; refresh everything that shows this worker. */
function invalidate(workerId: string, slug?: string) {
  updateTag(TAGS.worker(workerId));
  updateTag(TAGS.workers);
  if (slug) updateTag(`worker-slug:${slug}`);
}

/** A file directly inside the user's own storage folder; the database checks the same shape. */
function ownedPath(userId: string, path: unknown): boolean {
  return typeof path === "string" && path.startsWith(`${userId}/`) && /^[A-Za-z0-9._-]+$/.test(path.slice(userId.length + 1)) && !path.includes("..");
}

// ---------------------------------------------------------------- profile

export async function saveProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  try {
    const { user, repos } = await authorized();
    const before = await repos.workers.getById(user.id);
    if (!before) throw new DomainError("not_found");
    // Saves go live immediately, so a published profile can't drop below what publishing requires.
    if (before.isPublished) {
      const fieldErrors = liveProfileErrors(data);
      if (Object.keys(fieldErrors).length > 0) return { ok: false, error: "validation", fieldErrors };
    }

    // Try the preferred address first; if someone already has it, fall back to the next candidate.
    const candidates = slugCandidates(before, data.fullName);
    let slug = before.slug;
    for (const [i, candidate] of candidates.entries()) {
      try {
        await repos.workers.updateProfile(user.id, {
          slug: candidate,
          fullName: data.fullName,
          headline: data.headline,
          bio: data.bio,
          yearsExperience: data.yearsExperience,
          contacts: data.contacts,
        });
        slug = candidate;
        break;
      } catch (error) {
        const lastCandidate = i === candidates.length - 1;
        if (!(error instanceof DomainError && error.code === "conflict") || lastCandidate) throw error;
      }
    }
    await repos.workers.setCities(user.id, data.cityIds);
    await repos.workers.setCategories(user.id, data.categoryIds);
    invalidate(user.id, slug);
    if (before.slug !== slug) updateTag(`worker-slug:${before.slug}`);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function setPublishedAction(published: boolean): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    await repos.workers.setPublished(user.id, Boolean(published));
    const profile = await repos.workers.getById(user.id);
    invalidate(user.id, profile?.slug);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function setAvatarAction(path: string | null): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    if (path !== null && !ownedPath(user.id, path)) throw new DomainError("validation");
    const profile = await repos.workers.getById(user.id);
    await repos.workers.setAvatar(user.id, path);
    if (profile?.avatar && profile.avatar.path !== path) {
      await repos.storage.remove("avatars", [profile.avatar.path]).catch(() => undefined);
    }
    invalidate(user.id, profile?.slug);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------- services

export async function saveServiceAction(serviceId: string | null, input: unknown): Promise<ActionResult<Service | null>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = { ...parsed.data, priceFrom: parsed.data.priceUnit === "negotiable" ? null : parsed.data.priceFrom };
  if (data.priceFrom === null) data.priceTo = null;
  try {
    const { user, repos } = await authorized();
    let created: Service | null = null;
    if (serviceId) await repos.services.update(user.id, serviceId, data);
    else {
      const existing = await repos.services.listByWorker(user.id);
      if (existing.length >= MAX_SERVICES) throw new DomainError("limit_reached");
      created = await repos.services.create(user.id, data);
    }
    invalidate(user.id);
    return ok(created);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteServiceAction(serviceId: string): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    await repos.services.delete(user.id, serviceId);
    invalidate(user.id);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function reorderServicesAction(serviceIds: string[]): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    await repos.services.reorder(user.id, serviceIds.map(String).slice(0, 200));
    invalidate(user.id);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------- portfolio

export async function addPortfolioImageAction(image: { path: string; thumbPath: string }): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    if (!ownedPath(user.id, image.path) || !ownedPath(user.id, image.thumbPath)) throw new DomainError("validation");
    const existing = await repos.portfolio.listByWorker(user.id);
    if (existing.length >= MAX_PORTFOLIO_IMAGES) {
      await repos.storage.remove("portfolio", [image.path, image.thumbPath]).catch(() => undefined);
      throw new DomainError("limit_reached");
    }
    await repos.portfolio.add(user.id, { path: image.path, thumbPath: image.thumbPath, caption: "" });
    invalidate(user.id);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function updateCaptionAction(imageId: string, caption: unknown): Promise<ActionResult> {
  const parsed = captionSchema.safeParse(caption);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { user, repos } = await authorized();
    await repos.portfolio.updateCaption(user.id, imageId, parsed.data);
    invalidate(user.id);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function deletePortfolioImageAction(imageId: string): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    const removed = await repos.portfolio.delete(user.id, imageId);
    if (removed) {
      await repos.storage.remove("portfolio", [removed.image.path, removed.thumb.path]).catch(() => undefined);
    }
    invalidate(user.id);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function reorderPortfolioAction(imageIds: string[]): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    await repos.portfolio.reorder(user.id, imageIds.map(String).slice(0, MAX_PORTFOLIO_IMAGES));
    invalidate(user.id);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------- account

/** Requires the current password, so a hijacked session alone can't take over the account. */
export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { repos } = await authorized();
    if (!(await repos.auth.verifyPassword(parsed.data.current))) {
      return { ok: false, error: "validation", fieldErrors: { current: "wrong_password" } };
    }
    await repos.auth.updatePassword(parsed.data.password);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAccountAction(): Promise<ActionResult> {
  try {
    const { user, repos } = await authorized();
    const profile = await repos.workers.getById(user.id);
    // Files first: once the account is gone, storage policies no longer let us delete them. List the
    // whole folder (not just the paths in the database) so abandoned uploads go too, and stop if that
    // fails rather than leave public photos of a deleted account behind.
    for (const bucket of STORAGE_BUCKETS) {
      const files = await repos.storage.list(bucket, user.id);
      if (files.length) await repos.storage.remove(bucket, files);
    }
    await repos.auth.deleteAccount();
    invalidate(user.id, profile?.slug);
    return ok();
  } catch (error) {
    return fail(error);
  }
}
