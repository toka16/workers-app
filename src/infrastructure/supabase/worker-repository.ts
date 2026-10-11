import type { Page, PlatformStats, SearchFilters, WorkerProfile, WorkerSummary } from "@/domain/models";
import type { ProfileUpdate, UrlResolver, WorkerRepository } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { check, checkMaybe, checkOk } from "./errors";
import { toWorkerProfile, toWorkerSummary, type ProfileRowWithRelations } from "./mappers";

const PROFILE_SELECT = `
  *,
  worker_cities ( cities ( * ) ),
  worker_categories ( categories ( * ) ),
  worker_services ( * ),
  portfolio_images ( * )
`;

export class SupabaseWorkerRepository implements WorkerRepository {
  constructor(
    private readonly db: TypedSupabaseClient,
    private readonly resolveUrl: UrlResolver,
  ) {}

  async search(filters: SearchFilters): Promise<Page<WorkerSummary>> {
    const rows = check(
      await this.db.rpc("search_workers", {
        q: filters.q || undefined,
        category_slugs: filters.categories.length ? filters.categories : undefined,
        city_slugs: filters.cities.length ? filters.cities : undefined,
        price_max: filters.priceMax ?? undefined,
        min_experience: filters.minExperience ?? undefined,
        with_photos: filters.withPhotos,
        sort_by: filters.sort,
        page_limit: filters.pageSize,
        page_offset: (filters.page - 1) * filters.pageSize,
      }),
    );
    return {
      items: rows.map((row) => toWorkerSummary(this.resolveUrl, row)),
      total: rows[0]?.total_count ?? 0,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async getPublishedBySlug(slug: string): Promise<WorkerProfile | null> {
    const row = checkMaybe(
      await this.db
        .from("worker_profiles")
        .select(PROFILE_SELECT)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle(),
    );
    return row ? toWorkerProfile(this.resolveUrl, row as ProfileRowWithRelations) : null;
  }

  async getById(id: string): Promise<WorkerProfile | null> {
    const row = checkMaybe(await this.db.from("worker_profiles").select(PROFILE_SELECT).eq("id", id).maybeSingle());
    return row ? toWorkerProfile(this.resolveUrl, row as ProfileRowWithRelations) : null;
  }

  async listPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    const rows = check(
      await this.db.from("worker_profiles").select("slug, updated_at").eq("is_published", true).limit(5000),
    );
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
  }

  async getStats(): Promise<PlatformStats> {
    const rows = check(await this.db.rpc("platform_stats"));
    const row = rows[0];
    return { workers: row?.workers ?? 0, cities: row?.cities ?? 0, categories: row?.categories ?? 0 };
  }

  async updateProfile(workerId: string, update: ProfileUpdate): Promise<void> {
    checkOk(
      await this.db
        .from("worker_profiles")
        .update({
          slug: update.slug,
          full_name: update.fullName,
          headline: update.headline,
          bio: update.bio,
          years_experience: update.yearsExperience,
          phone: update.contacts.phone,
          contact_email: update.contacts.email,
          whatsapp: update.contacts.whatsapp,
          viber: update.contacts.viber,
          telegram: update.contacts.telegram,
          facebook: update.contacts.facebook,
          website: update.contacts.website,
        })
        .eq("id", workerId),
    );
  }

  async setAvatar(workerId: string, avatarPath: string | null): Promise<void> {
    checkOk(await this.db.from("worker_profiles").update({ avatar_path: avatarPath }).eq("id", workerId));
  }

  async setPublished(workerId: string, published: boolean): Promise<void> {
    checkOk(await this.db.from("worker_profiles").update({ is_published: published }).eq("id", workerId));
  }

  async setCities(workerId: string, cityIds: number[]): Promise<void> {
    const current = check(await this.db.from("worker_cities").select("city_id").eq("worker_id", workerId));
    const { toAdd, toRemove } = diff(current.map((r) => r.city_id), cityIds);
    // Add before removing so a published profile never passes through an empty state.
    if (toAdd.length) {
      checkOk(await this.db.from("worker_cities").insert(toAdd.map((city_id) => ({ worker_id: workerId, city_id }))));
    }
    if (toRemove.length) {
      checkOk(await this.db.from("worker_cities").delete().eq("worker_id", workerId).in("city_id", toRemove));
    }
  }

  async setCategories(workerId: string, categoryIds: number[]): Promise<void> {
    const current = check(await this.db.from("worker_categories").select("category_id").eq("worker_id", workerId));
    const { toAdd, toRemove } = diff(current.map((r) => r.category_id), categoryIds);
    if (toAdd.length) {
      checkOk(
        await this.db
          .from("worker_categories")
          .insert(toAdd.map((category_id) => ({ worker_id: workerId, category_id }))),
      );
    }
    if (toRemove.length) {
      checkOk(await this.db.from("worker_categories").delete().eq("worker_id", workerId).in("category_id", toRemove));
    }
  }
}

function diff(current: number[], wanted: number[]) {
  const have = new Set(current);
  const want = new Set(wanted);
  return {
    toAdd: [...want].filter((id) => !have.has(id)),
    toRemove: [...have].filter((id) => !want.has(id)),
  };
}
