import { describe, expect, it } from "vitest";
import { countActiveFilters, filtersToSearchParams, parseSearchParams, profileSchema, serviceSchema } from "@/domain/schemas";

describe("search params", () => {
  it("parses lists, numbers and defaults", () => {
    const f = parseSearchParams({ city: "tbilisi,batumi", category: ["plumbing"], priceMax: "50", exp: "3", photos: "1", page: "2" });
    expect(f).toMatchObject({
      cities: ["tbilisi", "batumi"],
      categories: ["plumbing"],
      priceMax: 50,
      minExperience: 3,
      withPhotos: true,
      sort: "recommended",
      page: 2,
    });
    expect(countActiveFilters(f)).toBe(6);
  });

  it("ignores garbage input", () => {
    const f = parseSearchParams({ city: "<script>", sort: "drop table", page: "-4", priceMax: "abc" });
    expect(f.cities).toEqual([]);
    expect(f.sort).toBe("recommended");
    expect(f.page).toBe(1);
    expect(f.priceMax).toBeNull();
  });

  it("round-trips through the URL and omits defaults", () => {
    const original = parseSearchParams({ q: "ონკანი", city: "tbilisi", sort: "price_asc" });
    const query = filtersToSearchParams(original);
    expect(query.has("page")).toBe(false);
    expect(parseSearchParams(Object.fromEntries(query))).toEqual(original);
    expect(filtersToSearchParams(parseSearchParams({})).toString()).toBe("");
  });
});

describe("profileSchema", () => {
  const base = {
    fullName: " Giorgi ",
    headline: "",
    bio: "",
    yearsExperience: "",
    cityIds: ["1", 2],
    categoryIds: [3],
    contacts: { phone: "+995 555 12-34-56", whatsapp: "", viber: "", telegram: "@giorgi_b", email: "", facebook: "", website: "" },
  };

  it("normalizes form values", () => {
    const parsed = profileSchema.parse(base);
    expect(parsed.fullName).toBe("Giorgi");
    expect(parsed).not.toHaveProperty("slug"); // addresses are generated, never user input
    expect(parsed.yearsExperience).toBeNull();
    expect(parsed.cityIds).toEqual([1, 2]);
    expect(parsed.contacts.phone).toBe("+995555123456");
    expect(parsed.contacts.whatsapp).toBeNull();
  });

  it("rejects invalid contacts with i18n keys", () => {
    const result = profileSchema.safeParse({ ...base, contacts: { ...base.contacts, website: "not a url" } });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(result.error!.issues.map((i) => [i.path.join("."), i.message]));
    expect(messages["contacts.website"]).toBe("invalid_url");
  });
});

describe("serviceSchema", () => {
  it("requires a price unless negotiable", () => {
    expect(serviceSchema.safeParse({ title: "x", description: "", categoryId: "", priceUnit: "hour", priceFrom: "", priceTo: "" }).success).toBe(false);
    expect(serviceSchema.safeParse({ title: "x", description: "", categoryId: "", priceUnit: "negotiable", priceFrom: "", priceTo: "" }).success).toBe(true);
  });

  it("validates the range", () => {
    const result = serviceSchema.safeParse({ title: "x", description: "", categoryId: "2", priceUnit: "fixed", priceFrom: "50", priceTo: "10" });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe("price_range_invalid");
  });
});
