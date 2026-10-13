import { describe, expect, it } from "vitest";
import type { ContactInfo, PortfolioImage, Service, WorkerProfile } from "@/domain/models";
import { liveProfileErrors } from "@/domain/profile";
import { adjacentSteps, firstIncompleteStep, OPTIONAL_STEPS, stepForItem, stepStatus } from "@/domain/profile-steps";

const noContacts: ContactInfo = { phone: null, email: null, whatsapp: null, viber: null, telegram: null, facebook: null, website: null };

function profile(overrides: Partial<WorkerProfile> = {}): WorkerProfile {
  return {
    id: "w1",
    slug: "worker-0123456789",
    fullName: "Nino",
    headline: "",
    bio: "",
    avatar: null,
    yearsExperience: null,
    contacts: noContacts,
    isPublished: false,
    cities: [],
    categories: [],
    services: [],
    portfolio: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

const complete = profile({
  headline: "Cleaner",
  avatar: { path: "a", url: "a" },
  contacts: { ...noContacts, phone: "+995555000001" },
  cities: [{ id: 1, slug: "tbilisi", name: { ka: "", en: "" } }],
  categories: [{ id: 3, slug: "cleaning", name: { ka: "", en: "" }, icon: "x" }],
  services: [{ id: "s" } as Service],
  portfolio: [{ id: "p" } as PortfolioImage],
});

describe("profile editor steps", () => {
  it("marks steps missing publish requirements as required, the rest as todo", () => {
    const fresh = profile();
    expect(stepStatus(fresh, "basics")).toBe("todo"); // name is there, photo and headline aren't
    expect(stepStatus(fresh, "area")).toBe("required");
    expect(stepStatus(fresh, "contacts")).toBe("required");
    expect(stepStatus(fresh, "services")).toBe("todo");
    expect(stepStatus(profile({ fullName: "" }), "basics")).toBe("required");
    expect(stepStatus(complete, "area")).toBe("done");
  });

  it("only services and photos are optional", () => {
    expect(OPTIONAL_STEPS).toEqual(["services", "portfolio"]);
  });

  it("resumes at the first unfinished step and ends at the review", () => {
    expect(firstIncompleteStep(profile())).toBe("basics");
    expect(firstIncompleteStep({ ...complete, portfolio: [] })).toBe("portfolio");
    expect(firstIncompleteStep(complete)).toBe("review");
  });

  it("the review is done once the profile is published", () => {
    expect(stepStatus(complete, "review")).toBe("todo");
    expect(stepStatus({ ...complete, isPublished: true }, "review")).toBe("done");
  });

  it("maps checklist items and neighbours", () => {
    expect(stepForItem("city")).toBe("area");
    expect(stepForItem("avatar")).toBe("basics");
    expect(stepForItem("portfolio")).toBe("portfolio");
    expect(adjacentSteps("basics")).toEqual({ prev: null, next: "area" });
    expect(adjacentSteps("review")).toEqual({ prev: "portfolio", next: null });
  });
});

describe("liveProfileErrors", () => {
  const valid = { cityIds: [1], categoryIds: [3], contacts: { ...noContacts, telegram: "@nino" } };

  it("accepts edits that keep the profile publishable", () => {
    expect(liveProfileErrors(valid)).toEqual({});
  });

  it("flags removing every city, category or contact (a website alone doesn't count)", () => {
    expect(liveProfileErrors({ cityIds: [], categoryIds: [], contacts: { ...noContacts, website: "https://x.ge" } })).toEqual({
      cityIds: "required_while_live",
      categoryIds: "required_while_live",
      contacts: "contact_required_while_live",
    });
  });
});
