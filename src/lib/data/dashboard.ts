import "server-only";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { getRepositories } from "@/infrastructure/container.server";
import { redirect } from "@/i18n/navigation";

/**
 * Data access for the signed-in worker. Reads cookies, so callers must render behind <Suspense>.
 * Authorization is enforced again by the database (RLS); this is the app-level check.
 */
export const requireWorker = cache(async () => {
  const repos = await getRepositories();
  const user = await repos.auth.getCurrentUser();
  if (!user) {
    redirect({ href: "/auth/login", locale: await getLocale() });
  }
  return { user: user!, repos };
});

export const getOwnProfile = cache(async () => {
  const { user, repos } = await requireWorker();
  const profile = await repos.workers.getById(user.id);
  if (!profile) redirect({ href: "/auth/login", locale: await getLocale() });
  return { user, profile: profile!, repos };
});
