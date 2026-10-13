import type { Category, City, PriceUnit } from "@/domain/models";

export interface MemoryProfile {
  id: string;
  slug: string;
  fullName: string;
  headline: string;
  bio: string;
  avatarPath: string | null;
  yearsExperience: number | null;
  contacts: {
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    viber: string | null;
    telegram: string | null;
    facebook: string | null;
    website: string | null;
  };
  isPublished: boolean;
  cityIds: number[];
  categoryIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryService {
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

export interface MemoryImage {
  id: string;
  workerId: string;
  path: string;
  thumbPath: string;
  caption: string;
  sort: number;
}

export interface MemoryUser {
  id: string;
  email: string;
  password: string;
  confirmed: boolean;
}

/** Shared state for the in-memory provider (tests, demos, prototyping without a backend). */
export class MemoryStore {
  cities: City[] = [
    { id: 1, slug: "tbilisi", name: { ka: "თბილისი", en: "Tbilisi" } },
    { id: 2, slug: "batumi", name: { ka: "ბათუმი", en: "Batumi" } },
    { id: 3, slug: "kutaisi", name: { ka: "ქუთაისი", en: "Kutaisi" } },
  ];
  categories: Category[] = [
    { id: 1, slug: "plumbing", name: { ka: "სანტექნიკა", en: "Plumbing" }, icon: "droplets" },
    { id: 2, slug: "electrical", name: { ka: "ელექტროობა", en: "Electrical" }, icon: "zap" },
    { id: 3, slug: "cleaning", name: { ka: "დალაგება", en: "Cleaning" }, icon: "sparkles" },
  ];
  users = new Map<string, MemoryUser>();
  profiles = new Map<string, MemoryProfile>();
  services = new Map<string, MemoryService>();
  images = new Map<string, MemoryImage>();
  files = new Map<string, Blob>();
  /** The "session" — which user is signed in. */
  currentUserId: string | null = null;
  /** Whether that session came from an e-mail link rather than a password sign-in. */
  emailLinkSession = false;

  createUser(email: string, password: string, fullName = "", confirmed = true): MemoryUser {
    const id = crypto.randomUUID();
    const user = { id, email, password, confirmed };
    this.users.set(id, user);
    const now = new Date().toISOString();
    this.profiles.set(id, {
      id,
      slug: `worker-${id.replace(/-/g, "").slice(0, 10)}`,
      fullName,
      headline: "",
      bio: "",
      avatarPath: null,
      yearsExperience: null,
      contacts: { phone: null, email: null, whatsapp: null, viber: null, telegram: null, facebook: null, website: null },
      isPublished: false,
      cityIds: [],
      categoryIds: [],
      createdAt: now,
      updatedAt: now,
    });
    return user;
  }

  reset(): void {
    this.users.clear();
    this.profiles.clear();
    this.services.clear();
    this.images.clear();
    this.files.clear();
    this.currentUserId = null;
    this.emailLinkSession = false;
  }
}

const globalStore = globalThis as unknown as { __workersMemoryStore?: MemoryStore };
export const memoryStore = (globalStore.__workersMemoryStore ??= new MemoryStore());
