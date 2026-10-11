export const LOCALES = ["ka", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ka";

export interface LocalizedText {
  ka: string;
  en: string;
}

export interface City {
  id: number;
  slug: string;
  name: LocalizedText;
}

export interface Category {
  id: number;
  slug: string;
  name: LocalizedText;
  /** lucide icon name, e.g. "droplets" */
  icon: string;
}

export const PRICE_UNITS = ["fixed", "hour", "day", "sqm", "item", "negotiable"] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

/** A file kept in a storage provider. `path` is what we persist, `url` is what we render. */
export interface StoredImage {
  path: string;
  url: string;
}

export interface Service {
  id: string;
  workerId: string;
  categoryId: number | null;
  title: string;
  description: string;
  priceFrom: number | null;
  priceTo: number | null;
  priceUnit: PriceUnit;
  currency: string;
  sort: number;
}

export interface PortfolioImage {
  id: string;
  workerId: string;
  image: StoredImage;
  thumb: StoredImage;
  caption: string;
  sort: number;
}

export interface ContactInfo {
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  viber: string | null;
  telegram: string | null;
  facebook: string | null;
  website: string | null;
}

export interface WorkerProfile {
  id: string;
  slug: string;
  fullName: string;
  headline: string;
  bio: string;
  avatar: StoredImage | null;
  yearsExperience: number | null;
  contacts: ContactInfo;
  isPublished: boolean;
  cities: City[];
  categories: Category[];
  services: Service[];
  portfolio: PortfolioImage[];
  createdAt: string;
  updatedAt: string;
}

/** Compact projection used in search results and listings. */
export interface WorkerSummary {
  id: string;
  slug: string;
  fullName: string;
  headline: string;
  avatar: StoredImage | null;
  yearsExperience: number | null;
  citySlugs: string[];
  categorySlugs: string[];
  minPrice: number | null;
  currency: string | null;
  photoCount: number;
  cover: StoredImage | null;
}

export const SORT_OPTIONS = ["recommended", "newest", "price_asc", "price_desc", "experience"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface SearchFilters {
  q: string;
  categories: string[];
  cities: string[];
  priceMax: number | null;
  minExperience: number | null;
  withPhotos: boolean;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlatformStats {
  workers: number;
  cities: number;
  categories: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export const STORAGE_BUCKETS = ["avatars", "portfolio"] as const;
export type StorageBucket = (typeof STORAGE_BUCKETS)[number];
