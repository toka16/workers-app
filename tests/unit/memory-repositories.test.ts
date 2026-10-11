import { beforeEach, describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import { completenessPercent, missingForPublish } from "@/domain/profile";
import { parseSearchParams } from "@/domain/schemas";
import { createMemoryServerProvider } from "@/infrastructure/memory/provider";
import { MemoryStore } from "@/infrastructure/memory/store";
import type { Repositories } from "@/repositories";

/**
 * The app only depends on repository interfaces. These tests run real use cases against the
 * in-memory provider, which mirrors the Supabase RLS rules (owner-only writes, publish checks).
 */
async function setup(): Promise<{ store: MemoryStore; repos: Repositories }> {
  const store = new MemoryStore();
  const provider = createMemoryServerProvider(store);
  const storage = await provider.createStorage!("request");
  const data = await provider.createData!("request", storage.getPublicUrl.bind(storage));
  return { store, repos: { auth: await provider.createAuth!(), storage, ...data } };
}

const contacts = { phone: "+995555000001", email: null, whatsapp: null, viber: null, telegram: null, facebook: null, website: null };

describe("worker lifecycle (memory provider)", () => {
  let store: MemoryStore;
  let repos: Repositories;

  beforeEach(async () => ({ store, repos } = await setup()));

  it("requires e-mail confirmation before sign-in", async () => {
    await repos.auth.signUp({ email: "w@x.ge", password: "password1", fullName: "W", emailRedirectTo: "" });
    await expect(repos.auth.signIn("w@x.ge", "password1")).rejects.toMatchObject({ code: "email_not_confirmed" });
    const user = [...store.users.values()][0];
    await repos.auth.exchangeCodeForSession(user.id);
    expect(await repos.auth.getCurrentUser()).toMatchObject({ email: "w@x.ge" });
  });

  it("publishes only complete profiles and then shows them in search", async () => {
    const user = store.createUser("a@x.ge", "password1", "Nino");
    await repos.auth.signIn("a@x.ge", "password1");

    await expect(repos.workers.setPublished(user.id, true)).rejects.toBeInstanceOf(DomainError);

    await repos.workers.updateProfile(user.id, { slug: "nino", fullName: "Nino", headline: "Cleaner", bio: "", yearsExperience: 4, contacts });
    await repos.workers.setCities(user.id, [1]);
    await repos.workers.setCategories(user.id, [3]);
    await repos.services.create(user.id, { title: "Flat cleaning", description: "", categoryId: 3, priceFrom: 60, priceTo: null, priceUnit: "fixed" });

    const draft = await repos.workers.getById(user.id);
    expect(missingForPublish(draft!)).toEqual([]);
    expect(completenessPercent(draft!)).toBe(75); // 6 of 8: no avatar, no portfolio yet

    await repos.workers.setPublished(user.id, true);
    await repos.auth.signOut();

    const page = await repos.workers.search(parseSearchParams({ city: "tbilisi", category: "cleaning", priceMax: "80" }));
    expect(page.items.map((w) => w.slug)).toEqual(["nino"]);
    expect(page.items[0].minPrice).toBe(60);
    expect(await repos.workers.search(parseSearchParams({ city: "batumi" }))).toMatchObject({ total: 0 });
    expect(await repos.workers.getPublishedBySlug("nino")).not.toBeNull();
  });

  it("hides drafts from visitors", async () => {
    const user = store.createUser("b@x.ge", "password1", "Draft");
    expect(await repos.workers.getById(user.id)).toBeNull();
    expect(await repos.workers.getPublishedBySlug(store.profiles.get(user.id)!.slug)).toBeNull();
  });

  it("prevents editing someone else's profile, services or files", async () => {
    const owner = store.createUser("o@x.ge", "password1", "Owner");
    store.createUser("i@x.ge", "password1", "Intruder");
    await repos.auth.signIn("i@x.ge", "password1");

    await expect(repos.workers.setAvatar(owner.id, null)).rejects.toMatchObject({ code: "unauthorized" });
    await expect(
      repos.services.create(owner.id, { title: "x", description: "", categoryId: null, priceFrom: 1, priceTo: null, priceUnit: "fixed" }),
    ).rejects.toMatchObject({ code: "unauthorized" });
    await expect(
      repos.storage.upload("portfolio", `${owner.id}/evil.webp`, new Blob(["x"]), { contentType: "image/webp" }),
    ).rejects.toMatchObject({ code: "upload_failed" });
  });

  it("rejects duplicate profile addresses", async () => {
    const a = store.createUser("a@x.ge", "password1", "A");
    const b = store.createUser("b@x.ge", "password1", "B");
    await repos.auth.signIn("a@x.ge", "password1");
    await repos.workers.updateProfile(a.id, { slug: "master", fullName: "A", headline: "", bio: "", yearsExperience: null, contacts });
    await repos.auth.signIn("b@x.ge", "password1");
    await expect(
      repos.workers.updateProfile(b.id, { slug: "master", fullName: "B", headline: "", bio: "", yearsExperience: null, contacts }),
    ).rejects.toMatchObject({ code: "conflict" });
  });
});
