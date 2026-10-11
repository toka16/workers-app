import { DomainError } from "@/domain/errors";
import type {
  AuthUser,
  Page,
  PlatformStats,
  PortfolioImage,
  SearchFilters,
  Service,
  StorageBucket,
  WorkerProfile,
  WorkerSummary,
} from "@/domain/models";
import type {
  AuthRepository,
  FileStorage,
  PortfolioImageWrite,
  PortfolioRepository,
  ProfileUpdate,
  ReferenceRepository,
  ServiceRepository,
  ServiceWrite,
  SignUpInput,
  UploadOptions,
  UrlResolver,
  WorkerRepository,
} from "@/repositories";
import type { MemoryImage, MemoryProfile, MemoryService, MemoryStore } from "./store";

/**
 * In-memory implementations. They enforce the same ownership rules as the Supabase RLS policies
 * so that use-case tests exercise realistic behaviour.
 */

function requireOwner(store: MemoryStore, workerId: string): void {
  if (!store.currentUserId || store.currentUserId !== workerId) throw new DomainError("unauthorized");
}

export class MemoryAuthRepository implements AuthRepository {
  constructor(private readonly store: MemoryStore) {}

  async getCurrentUser(): Promise<AuthUser | null> {
    const user = this.store.currentUserId ? this.store.users.get(this.store.currentUserId) : undefined;
    return user ? { id: user.id, email: user.email } : null;
  }

  async signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }> {
    if ([...this.store.users.values()].some((u) => u.email === input.email)) throw new DomainError("user_exists");
    if (input.password.length < 8) throw new DomainError("weak_password");
    this.store.createUser(input.email, input.password, input.fullName, false);
    return { needsConfirmation: true };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const user = [...this.store.users.values()].find((u) => u.email === email && u.password === password);
    if (!user) throw new DomainError("invalid_credentials");
    if (!user.confirmed) throw new DomainError("email_not_confirmed");
    this.store.currentUserId = user.id;
    return { id: user.id, email: user.email };
  }

  async signOut(): Promise<void> {
    this.store.currentUserId = null;
  }

  async requestPasswordReset(): Promise<void> {}

  async updatePassword(password: string): Promise<void> {
    const user = this.store.currentUserId ? this.store.users.get(this.store.currentUserId) : undefined;
    if (!user) throw new DomainError("unauthorized");
    user.password = password;
  }

  async exchangeCodeForSession(code: string): Promise<void> {
    // Test convention: the "code" is the user id.
    const user = this.store.users.get(code);
    if (!user) throw new DomainError("unauthorized");
    user.confirmed = true;
    this.store.currentUserId = user.id;
  }

  async deleteAccount(): Promise<void> {
    const id = this.store.currentUserId;
    if (!id) throw new DomainError("unauthorized");
    this.store.users.delete(id);
    this.store.profiles.delete(id);
    for (const [key, s] of this.store.services) if (s.workerId === id) this.store.services.delete(key);
    for (const [key, i] of this.store.images) if (i.workerId === id) this.store.images.delete(key);
    this.store.currentUserId = null;
  }
}

export class MemoryWorkerRepository implements WorkerRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly resolveUrl: UrlResolver,
  ) {}

  private visible(p: MemoryProfile): boolean {
    return p.isPublished || p.id === this.store.currentUserId;
  }

  private servicesOf(id: string): MemoryService[] {
    return [...this.store.services.values()].filter((s) => s.workerId === id).sort((a, b) => a.sort - b.sort);
  }

  private imagesOf(id: string): MemoryImage[] {
    return [...this.store.images.values()].filter((i) => i.workerId === id).sort((a, b) => a.sort - b.sort);
  }

  private toProfile(p: MemoryProfile): WorkerProfile {
    return {
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      headline: p.headline,
      bio: p.bio,
      avatar: p.avatarPath ? { path: p.avatarPath, url: this.resolveUrl("avatars", p.avatarPath) } : null,
      yearsExperience: p.yearsExperience,
      contacts: { ...p.contacts },
      isPublished: p.isPublished,
      cities: this.store.cities.filter((c) => p.cityIds.includes(c.id)),
      categories: this.store.categories.filter((c) => p.categoryIds.includes(c.id)),
      services: this.servicesOf(p.id).map((s) => ({ ...s })),
      portfolio: this.imagesOf(p.id).map((i) => toImage(this.resolveUrl, i)),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async search(filters: SearchFilters): Promise<Page<WorkerSummary>> {
    const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = [...this.store.profiles.values()]
      .filter((p) => p.isPublished)
      .map((p) => this.toProfile(p))
      .map((p) => ({ p, minPrice: minPrice(p.services) }))
      .filter(({ p, minPrice }) => {
        const text = [p.fullName, p.headline, p.bio, ...p.categories.flatMap((c) => [c.name.ka, c.name.en])]
          .join(" ")
          .toLowerCase();
        return (
          words.every((w) => text.includes(w)) &&
          (!filters.categories.length || p.categories.some((c) => filters.categories.includes(c.slug))) &&
          (!filters.cities.length || p.cities.some((c) => filters.cities.includes(c.slug))) &&
          (filters.priceMax == null || (minPrice != null && minPrice <= filters.priceMax)) &&
          (filters.minExperience == null || (p.yearsExperience ?? 0) >= filters.minExperience) &&
          (!filters.withPhotos || p.portfolio.length > 0)
        );
      });

    const sorters: Record<SearchFilters["sort"], (a: (typeof matches)[number], b: (typeof matches)[number]) => number> = {
      recommended: (a, b) => b.p.portfolio.length - a.p.portfolio.length,
      newest: (a, b) => b.p.createdAt.localeCompare(a.p.createdAt),
      price_asc: (a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity),
      price_desc: (a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity),
      experience: (a, b) => (b.p.yearsExperience ?? -1) - (a.p.yearsExperience ?? -1),
    };
    matches.sort(sorters[filters.sort]);

    const start = (filters.page - 1) * filters.pageSize;
    return {
      items: matches.slice(start, start + filters.pageSize).map(({ p, minPrice }) => ({
        id: p.id,
        slug: p.slug,
        fullName: p.fullName,
        headline: p.headline,
        avatar: p.avatar,
        yearsExperience: p.yearsExperience,
        citySlugs: p.cities.map((c) => c.slug),
        categorySlugs: p.categories.map((c) => c.slug),
        minPrice,
        currency: p.services[0]?.currency ?? null,
        photoCount: p.portfolio.length,
        cover: p.portfolio[0]?.thumb ?? null,
      })),
      total: matches.length,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async getPublishedBySlug(slug: string): Promise<WorkerProfile | null> {
    const p = [...this.store.profiles.values()].find((x) => x.slug === slug && x.isPublished);
    return p ? this.toProfile(p) : null;
  }

  async getById(id: string): Promise<WorkerProfile | null> {
    const p = this.store.profiles.get(id);
    return p && this.visible(p) ? this.toProfile(p) : null;
  }

  async listPublishedSlugs() {
    return [...this.store.profiles.values()]
      .filter((p) => p.isPublished)
      .map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
  }

  async getStats(): Promise<PlatformStats> {
    const published = [...this.store.profiles.values()].filter((p) => p.isPublished);
    return {
      workers: published.length,
      cities: new Set(published.flatMap((p) => p.cityIds)).size,
      categories: this.store.categories.length,
    };
  }

  private mutate(workerId: string, change: (p: MemoryProfile) => void): void {
    requireOwner(this.store, workerId);
    const p = this.store.profiles.get(workerId);
    if (!p) throw new DomainError("not_found");
    const draft = structuredClone(p);
    change(draft);
    if (draft.isPublished) {
      const missing = !draft.fullName.trim()
        ? "name"
        : !Object.values(draft.contacts).some(Boolean)
          ? "contact"
          : !draft.cityIds.length
            ? "city"
            : !draft.categoryIds.length
              ? "category"
              : null;
      if (missing) throw new DomainError("profile_incomplete", undefined, missing);
    }
    draft.updatedAt = new Date().toISOString();
    this.store.profiles.set(workerId, draft);
  }

  async updateProfile(workerId: string, update: ProfileUpdate): Promise<void> {
    const taken = [...this.store.profiles.values()].some((p) => p.slug === update.slug && p.id !== workerId);
    if (taken) throw new DomainError("conflict", "slug taken", "slug");
    this.mutate(workerId, (p) => Object.assign(p, update, { contacts: { ...update.contacts } }));
  }

  async setAvatar(workerId: string, avatarPath: string | null): Promise<void> {
    this.mutate(workerId, (p) => (p.avatarPath = avatarPath));
  }

  async setPublished(workerId: string, published: boolean): Promise<void> {
    this.mutate(workerId, (p) => (p.isPublished = published));
  }

  async setCities(workerId: string, cityIds: number[]): Promise<void> {
    this.mutate(workerId, (p) => (p.cityIds = [...new Set(cityIds)]));
  }

  async setCategories(workerId: string, categoryIds: number[]): Promise<void> {
    this.mutate(workerId, (p) => (p.categoryIds = [...new Set(categoryIds)]));
  }
}

function minPrice(services: Service[]): number | null {
  const prices = services.map((s) => s.priceFrom).filter((p): p is number => p != null);
  return prices.length ? Math.min(...prices) : null;
}

function toImage(resolveUrl: UrlResolver, i: MemoryImage): PortfolioImage {
  return {
    id: i.id,
    workerId: i.workerId,
    image: { path: i.path, url: resolveUrl("portfolio", i.path) },
    thumb: { path: i.thumbPath, url: resolveUrl("portfolio", i.thumbPath) },
    caption: i.caption,
    sort: i.sort,
  };
}

export class MemoryServiceRepository implements ServiceRepository {
  constructor(private readonly store: MemoryStore) {}

  async listByWorker(workerId: string): Promise<Service[]> {
    return [...this.store.services.values()].filter((s) => s.workerId === workerId).sort((a, b) => a.sort - b.sort);
  }

  async create(workerId: string, input: ServiceWrite): Promise<Service> {
    requireOwner(this.store, workerId);
    const existing = await this.listByWorker(workerId);
    const service: MemoryService = {
      ...input,
      id: crypto.randomUUID(),
      workerId,
      currency: "GEL",
      sort: (existing.at(-1)?.sort ?? -1) + 1,
    };
    this.store.services.set(service.id, service);
    return { ...service };
  }

  private owned(workerId: string, serviceId: string): MemoryService | undefined {
    requireOwner(this.store, workerId);
    const s = this.store.services.get(serviceId);
    return s?.workerId === workerId ? s : undefined;
  }

  async update(workerId: string, serviceId: string, input: ServiceWrite): Promise<void> {
    const s = this.owned(workerId, serviceId);
    if (s) Object.assign(s, input);
  }

  async delete(workerId: string, serviceId: string): Promise<void> {
    if (this.owned(workerId, serviceId)) this.store.services.delete(serviceId);
  }

  async reorder(workerId: string, serviceIds: string[]): Promise<void> {
    serviceIds.forEach((id, sort) => {
      const s = this.owned(workerId, id);
      if (s) s.sort = sort;
    });
  }
}

export class MemoryPortfolioRepository implements PortfolioRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly resolveUrl: UrlResolver,
  ) {}

  async listByWorker(workerId: string): Promise<PortfolioImage[]> {
    return [...this.store.images.values()]
      .filter((i) => i.workerId === workerId)
      .sort((a, b) => a.sort - b.sort)
      .map((i) => toImage(this.resolveUrl, i));
  }

  async add(workerId: string, input: PortfolioImageWrite): Promise<PortfolioImage> {
    requireOwner(this.store, workerId);
    const existing = await this.listByWorker(workerId);
    const image: MemoryImage = { ...input, id: crypto.randomUUID(), workerId, sort: (existing.at(-1)?.sort ?? -1) + 1 };
    this.store.images.set(image.id, image);
    return toImage(this.resolveUrl, image);
  }

  private owned(workerId: string, imageId: string): MemoryImage | undefined {
    requireOwner(this.store, workerId);
    const i = this.store.images.get(imageId);
    return i?.workerId === workerId ? i : undefined;
  }

  async updateCaption(workerId: string, imageId: string, caption: string): Promise<void> {
    const i = this.owned(workerId, imageId);
    if (i) i.caption = caption;
  }

  async delete(workerId: string, imageId: string): Promise<PortfolioImage | null> {
    const i = this.owned(workerId, imageId);
    if (!i) return null;
    this.store.images.delete(imageId);
    return toImage(this.resolveUrl, i);
  }

  async reorder(workerId: string, imageIds: string[]): Promise<void> {
    imageIds.forEach((id, sort) => {
      const i = this.owned(workerId, id);
      if (i) i.sort = sort;
    });
  }
}

export class MemoryReferenceRepository implements ReferenceRepository {
  constructor(private readonly store: MemoryStore) {}

  async listCities() {
    return [...this.store.cities];
  }

  async listCategories() {
    return [...this.store.categories];
  }
}

export class MemoryFileStorage implements FileStorage {
  constructor(private readonly store: MemoryStore) {}

  async upload(bucket: StorageBucket, path: string, file: Blob, options: UploadOptions): Promise<string> {
    void options;
    const owner = path.split("/")[0];
    if (!this.store.currentUserId || owner !== this.store.currentUserId) throw new DomainError("upload_failed");
    this.store.files.set(`${bucket}/${path}`, file);
    return path;
  }

  async remove(bucket: StorageBucket, paths: string[]): Promise<void> {
    for (const path of paths) this.store.files.delete(`${bucket}/${path}`);
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    return /^https?:\/\//.test(path) ? path : `memory://${bucket}/${path}`;
  }
}
