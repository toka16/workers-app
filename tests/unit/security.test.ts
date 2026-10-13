import { describe, expect, it } from "vitest";
import { isDemoImageUrl } from "@/domain/models";
import { changePasswordSchema, profileSchema } from "@/domain/schemas";
import { createMemoryServerProvider } from "@/infrastructure/memory/provider";
import { MemoryStore } from "@/infrastructure/memory/store";
import { safeNext } from "@/lib/safe-redirect";

describe("safeNext", () => {
  it("keeps same-origin paths with their query and hash", () => {
    expect(safeNext("/dashboard/profile?confirmed=1#top")).toBe("/dashboard/profile?confirmed=1#top");
    expect(safeNext("/en/workers")).toBe("/en/workers");
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    null,
    undefined,
  ])("rejects %j", (value) => {
    expect(safeNext(value)).toBe("/dashboard");
  });

  it("uses the given fallback", () => {
    expect(safeNext("//evil.com", "/")).toBe("/");
  });
});

describe("demo image hosts", () => {
  it("only allows https on the seeded hosts", () => {
    expect(isDemoImageUrl("https://picsum.photos/seed/x/480/360")).toBe(true);
    expect(isDemoImageUrl("https://i.pravatar.cc/400?img=1")).toBe(true);
    expect(isDemoImageUrl("http://picsum.photos/x")).toBe(false);
    expect(isDemoImageUrl("https://evil.example/pixel.png")).toBe(false);
    expect(isDemoImageUrl("https://picsum.photos.evil.example/x")).toBe(false);
  });

  it("drops non-demo absolute URLs when resolving image paths", async () => {
    const storage = await createMemoryServerProvider(new MemoryStore()).createStorage!("request");
    expect(storage.getPublicUrl("avatars", "https://evil.example/pixel.png")).toBe("");
    expect(storage.getPublicUrl("avatars", "https://i.pravatar.cc/400?img=1")).toBe("https://i.pravatar.cc/400?img=1");
  });
});

describe("contact validation", () => {
  const base = { fullName: "Worker", headline: "", bio: "", yearsExperience: null, cityIds: [], categoryIds: [] };
  const contacts = { phone: "", whatsapp: "", viber: "", telegram: "", email: "", facebook: "", website: "" };

  it("normalizes phones and requires at least six digits", () => {
    const ok = profileSchema.parse({ ...base, contacts: { ...contacts, phone: "+995 (555) 12-34-56" } });
    expect(ok.contacts.phone).toBe("+995555123456");
    expect(profileSchema.safeParse({ ...base, contacts: { ...contacts, phone: "((((1))))" } }).success).toBe(false);
  });

  it("only accepts Facebook links for the Facebook field", () => {
    const parse = (facebook: string) => profileSchema.safeParse({ ...base, contacts: { ...contacts, facebook } });
    expect(parse("https://facebook.com/master").success).toBe(true);
    expect(parse("https://www.facebook.com").success).toBe(true);
    expect(parse("https://fb.com/master").success).toBe(true);
    expect(parse("https://evil.example/facebook.com").success).toBe(false);
    expect(parse("http://facebook.com/master").success).toBe(false);
  });

  it("rejects websites with whitespace or other schemes", () => {
    const parse = (website: string) => profileSchema.safeParse({ ...base, contacts: { ...contacts, website } });
    expect(parse("https://example.ge").success).toBe(true);
    expect(parse("javascript:alert(1)//x.y").success).toBe(false);
    expect(parse("https://example.ge oops").success).toBe(false);
  });
});

describe("password change", () => {
  it("requires the current password and a matching confirmation", () => {
    expect(changePasswordSchema.safeParse({ current: "", password: "password1", confirm: "password1" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ current: "old", password: "password1", confirm: "password2" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ current: "old", password: "password1", confirm: "password1" }).success).toBe(true);
  });

  it("verifies the password and tells e-mail link sessions apart", async () => {
    const store = new MemoryStore();
    const auth = await createMemoryServerProvider(store).createAuth!();
    const user = store.createUser("w@x.ge", "password1");

    await auth.signIn("w@x.ge", "password1");
    expect(await auth.verifyPassword("password1")).toBe(true);
    expect(await auth.verifyPassword("nope")).toBe(false);
    expect(await auth.isRecentEmailLinkSession(3600)).toBe(false);

    await auth.signOut();
    await auth.exchangeCodeForSession(user.id);
    expect(await auth.isRecentEmailLinkSession(3600)).toBe(true);
  });
});

describe("storage listing", () => {
  it("lists only the files in the given folder", async () => {
    const store = new MemoryStore();
    const storage = await createMemoryServerProvider(store).createStorage!("request");
    store.files.set("portfolio/u1/a.webp", new Blob());
    store.files.set("portfolio/u1/b.webp", new Blob());
    store.files.set("portfolio/u2/c.webp", new Blob());
    store.files.set("avatars/u1/avatar.webp", new Blob());
    expect((await storage.list("portfolio", "u1")).sort()).toEqual(["u1/a.webp", "u1/b.webp"]);
  });
});
