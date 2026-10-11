import type {
  Category,
  City,
  PortfolioImage,
  Service,
  StorageBucket,
  StoredImage,
  WorkerProfile,
  WorkerSummary,
} from "@/domain/models";
import type { UrlResolver } from "@/repositories";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
type CityRow = Tables["cities"]["Row"];
type CategoryRow = Tables["categories"]["Row"];
type ServiceRow = Tables["worker_services"]["Row"];
type PortfolioRow = Tables["portfolio_images"]["Row"];
type ProfileRow = Tables["worker_profiles"]["Row"];
type SearchRow = Database["public"]["Functions"]["search_workers"]["Returns"][number];

function image(resolve: UrlResolver, bucket: StorageBucket, path: string | null): StoredImage | null {
  return path ? { path, url: resolve(bucket, path) } : null;
}

export const toCity = (row: CityRow): City => ({
  id: row.id,
  slug: row.slug,
  name: { ka: row.name_ka, en: row.name_en },
});

export const toCategory = (row: CategoryRow): Category => ({ ...toCity(row), icon: row.icon });

export const toService = (row: ServiceRow): Service => ({
  id: row.id,
  workerId: row.worker_id,
  categoryId: row.category_id,
  title: row.title,
  description: row.description,
  priceFrom: row.price_from,
  priceTo: row.price_to,
  priceUnit: row.price_unit,
  currency: row.currency,
  sort: row.sort,
});

export const toPortfolioImage = (resolve: UrlResolver, row: PortfolioRow): PortfolioImage => ({
  id: row.id,
  workerId: row.worker_id,
  image: image(resolve, "portfolio", row.path)!,
  thumb: image(resolve, "portfolio", row.thumb_path)!,
  caption: row.caption,
  sort: row.sort,
});

export type ProfileRowWithRelations = ProfileRow & {
  worker_cities: { cities: CityRow | null }[];
  worker_categories: { categories: CategoryRow | null }[];
  worker_services: ServiceRow[];
  portfolio_images: PortfolioRow[];
};

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

export function toWorkerProfile(resolve: UrlResolver, row: ProfileRowWithRelations): WorkerProfile {
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    headline: row.headline,
    bio: row.bio,
    avatar: image(resolve, "avatars", row.avatar_path),
    yearsExperience: row.years_experience,
    contacts: {
      phone: row.phone,
      email: row.contact_email,
      whatsapp: row.whatsapp,
      viber: row.viber,
      telegram: row.telegram,
      facebook: row.facebook,
      website: row.website,
    },
    isPublished: row.is_published,
    cities: row.worker_cities
      .flatMap((r) => (r.cities ? [r.cities] : []))
      .sort(bySort)
      .map(toCity),
    categories: row.worker_categories
      .flatMap((r) => (r.categories ? [r.categories] : []))
      .sort(bySort)
      .map(toCategory),
    services: row.worker_services.map(toService).sort(bySort),
    portfolio: row.portfolio_images.map((r) => toPortfolioImage(resolve, r)).sort(bySort),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toWorkerSummary(resolve: UrlResolver, row: SearchRow): WorkerSummary {
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    headline: row.headline,
    avatar: image(resolve, "avatars", row.avatar_path),
    yearsExperience: row.years_experience,
    citySlugs: row.city_slugs ?? [],
    categorySlugs: row.category_slugs ?? [],
    minPrice: row.min_price,
    currency: row.currency,
    photoCount: row.photo_count,
    cover: image(resolve, "portfolio", row.cover_thumb_path),
  };
}
