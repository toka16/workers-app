import type { Page, PlatformStats, SearchFilters, WorkerProfile, WorkerSummary, ContactInfo } from "@/domain/models";

export interface ProfileUpdate {
  slug: string;
  fullName: string;
  headline: string;
  bio: string;
  yearsExperience: number | null;
  contacts: ContactInfo;
}

export interface WorkerRepository {
  search(filters: SearchFilters): Promise<Page<WorkerSummary>>;
  /** Public profile; resolves to null when missing or unpublished. */
  getPublishedBySlug(slug: string): Promise<WorkerProfile | null>;
  /** Any profile the caller may see (owners can see their own draft). */
  getById(id: string): Promise<WorkerProfile | null>;
  listPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]>;
  getStats(): Promise<PlatformStats>;

  updateProfile(workerId: string, update: ProfileUpdate): Promise<void>;
  setAvatar(workerId: string, avatarPath: string | null): Promise<void>;
  setPublished(workerId: string, published: boolean): Promise<void>;
  setCities(workerId: string, cityIds: number[]): Promise<void>;
  setCategories(workerId: string, categoryIds: number[]): Promise<void>;
}
