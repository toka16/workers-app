import { describe, expect, it } from "vitest";
import { contactLinks } from "@/components/workers/contact-links";
import { formatPhoneForDisplay } from "@/lib/format";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("transliterates Georgian", () => {
    expect(slugify("გიორგი ბერიძე")).toBe("giorgi beridze".replace(" ", "-"));
    expect(slugify("ჭაჭა წყალი ღვინო")).toBe("chacha-tsqali-ghvino");
  });

  it("strips punctuation and accents", () => {
    expect(slugify("  Café & Co.!! ")).toBe("cafe-co");
  });
});

describe("contactLinks", () => {
  it("builds app deep links", () => {
    const links = contactLinks({
      phone: "+995555123456",
      whatsapp: "+995555123456",
      viber: "+995555123456",
      telegram: "@master",
      email: "a@b.ge",
      facebook: null,
      website: "https://www.example.ge",
    });
    expect(Object.fromEntries(links.map((l) => [l.kind, l.href]))).toEqual({
      phone: "tel:+995555123456",
      whatsapp: "https://wa.me/995555123456",
      viber: "viber://chat?number=%2B995555123456",
      telegram: "https://t.me/master",
      email: "mailto:a@b.ge",
      website: "https://www.example.ge",
    });
  });
});

describe("formatPhoneForDisplay", () => {
  it("groups Georgian mobile numbers", () => {
    expect(formatPhoneForDisplay("+995555123456")).toBe("+995 555 12 34 56");
    expect(formatPhoneForDisplay("+4412345")).toBe("+4412345");
  });
});
