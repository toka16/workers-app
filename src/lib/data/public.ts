import { cacheLife, cacheTag } from "next/cache";
import type { SearchFilters } from "@/domain/models";
import { getPublicRepositories } from "@/infrastructure/container.server";

/**
 * Cached, session-less reads for public pages. They become part of the static shell
 * (or the ISR cache) and are invalidated with tags from the dashboard Server Actions.
 */

export const TAGS = {
  reference: "reference",
  workers: "workers",
  worker: (id: string) => `worker:${id}`,
} as const;

export async function getCities() {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.reference);
  return (await getPublicRepositories()).reference.listCities();
}

export async function getCategories() {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.reference);
  return (await getPublicRepositories()).reference.listCategories();
}

export async function getStats() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.workers);
  return (await getPublicRepositories()).workers.getStats();
}

export async function searchWorkers(filters: SearchFilters) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.workers);
  return (await getPublicRepositories()).workers.search(filters);
}

export async function getFeaturedWorkers(limit = 6) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.workers);
  const page = await (await getPublicRepositories()).workers.search({
    q: "",
    categories: [],
    cities: [],
    priceMax: null,
    minExperience: null,
    withPhotos: true,
    sort: "recommended",
    page: 1,
    pageSize: limit,
  });
  return page.items;
}

export async function getPublishedWorker(slug: string) {
  "use cache";
  cacheLife("hours");
  const worker = await (await getPublicRepositories()).workers.getPublishedBySlug(slug);
  cacheTag(TAGS.workers, worker ? TAGS.worker(worker.id) : `worker-slug:${slug}`);
  return worker;
}

export async function getPublishedSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.workers);
  return (await getPublicRepositories()).workers.listPublishedSlugs();
}
