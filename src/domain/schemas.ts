import { z } from "zod";
import { PRICE_UNITS, SORT_OPTIONS, type SearchFilters } from "./models";

// Messages are i18n keys under "validation.*" so the UI can translate them.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "too_long")
    .transform((v) => (v === "" ? null : v))
    .nullable();

const phone = z
  .string()
  .trim()
  .max(32, "too_long")
  .refine((v) => v === "" || /^\+?[0-9\s()-]{6,}$/.test(v), "invalid_phone")
  .transform((v) => (v === "" ? null : v.replace(/[\s()-]/g, "")))
  .nullable();

const url = z
  .string()
  .trim()
  .max(255, "too_long")
  .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), "invalid_url")
  .transform((v) => (v === "" ? null : v))
  .nullable();

/** Accepts "", null, numbers and numeric strings (form inputs); empty becomes null. */
const optionalNumber = (max: number, { int = false } = {}) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    (int ? z.number().int("invalid_number") : z.number("invalid_number"))
      .min(0, "invalid_number")
      .max(max, "invalid_number")
      .nullable(),
  );

const id = z.preprocess((v) => Number(v), z.number().int().positive());

export const emailSchema = z.string().trim().toLowerCase().email("invalid_email").max(254, "too_long");
export const passwordSchema = z.string().min(8, "password_too_short").max(72, "too_long");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "required"),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "required").max(120, "too_long"),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "passwords_mismatch", path: ["confirm"] });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "required").max(120, "too_long"),
  headline: z.string().trim().max(160, "too_long"),
  bio: z.string().trim().max(4000, "too_long"),
  yearsExperience: optionalNumber(80, { int: true }),
  cityIds: z.array(id).max(30),
  categoryIds: z.array(id).max(8, "too_many_categories"),
  contacts: z.object({
    phone,
    whatsapp: phone,
    viber: phone,
    telegram: optionalText(64).refine(
      (v) => v === null || /^@?[a-zA-Z0-9_]{3,64}$/.test(v),
      "invalid_telegram",
    ),
    email: z
      .string()
      .trim()
      .max(254, "too_long")
      .refine((v) => v === "" || z.email().safeParse(v).success, "invalid_email")
      .transform((v) => (v === "" ? null : v.toLowerCase()))
      .nullable(),
    facebook: url,
    website: url,
  }),
});
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

export const serviceSchema = z
  .object({
    title: z.string().trim().min(1, "required").max(120, "too_long"),
    description: z.string().trim().max(1000, "too_long"),
    categoryId: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
    priceUnit: z.enum(PRICE_UNITS),
    priceFrom: optionalNumber(1_000_000),
    priceTo: optionalNumber(1_000_000),
  })
  .refine((v) => v.priceUnit === "negotiable" || v.priceFrom !== null, {
    message: "price_required",
    path: ["priceFrom"],
  })
  .refine((v) => v.priceTo === null || v.priceFrom === null || v.priceTo >= v.priceFrom, {
    message: "price_range_invalid",
    path: ["priceTo"],
  });
export type ServiceInput = z.input<typeof serviceSchema>;
export type ServiceData = z.output<typeof serviceSchema>;

export const captionSchema = z.string().trim().max(200, "too_long");

// ---------------------------------------------------------------------------
// Search params <-> filters
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 12;

type RawParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.flatMap((v) => v.split(",")).map((v) => v.trim()).filter((v) => /^[a-z0-9-]{1,40}$/.test(v)))];
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined, max: number): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null;
}

export function parseSearchParams(params: RawParams): SearchFilters {
  const sort = first(params.sort);
  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    categories: list(params.category),
    cities: list(params.city),
    priceMax: positiveInt(first(params.priceMax), 1_000_000),
    minExperience: positiveInt(first(params.exp), 80),
    withPhotos: first(params.photos) === "1",
    sort: (SORT_OPTIONS as readonly string[]).includes(sort ?? "") ? (sort as SearchFilters["sort"]) : "recommended",
    page: Math.max(1, positiveInt(first(params.page), 10_000) ?? 1),
    pageSize: PAGE_SIZE,
  };
}

/** Inverse of parseSearchParams; omits defaults so URLs stay short. */
export function filtersToSearchParams(filters: Partial<SearchFilters>): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.categories?.length) sp.set("category", filters.categories.join(","));
  if (filters.cities?.length) sp.set("city", filters.cities.join(","));
  if (filters.priceMax != null) sp.set("priceMax", String(filters.priceMax));
  if (filters.minExperience != null) sp.set("exp", String(filters.minExperience));
  if (filters.withPhotos) sp.set("photos", "1");
  if (filters.sort && filters.sort !== "recommended") sp.set("sort", filters.sort);
  if (filters.page && filters.page > 1) sp.set("page", String(filters.page));
  return sp;
}

export function countActiveFilters(filters: SearchFilters): number {
  return (
    filters.categories.length +
    filters.cities.length +
    (filters.priceMax != null ? 1 : 0) +
    (filters.minExperience != null ? 1 : 0) +
    (filters.withPhotos ? 1 : 0)
  );
}
