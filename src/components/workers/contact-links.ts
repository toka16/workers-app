import type { ContactInfo } from "@/domain/models";

export type ContactKind = "phone" | "whatsapp" | "viber" | "telegram" | "email" | "facebook" | "website";

export interface ContactLink {
  kind: ContactKind;
  href: string;
  value: string;
}

const digits = (phone: string) => phone.replace(/[^\d]/g, "");

/** Turns stored contact values into deep links that open the right app on phones. */
export function contactLinks(contacts: ContactInfo): ContactLink[] {
  const links: ContactLink[] = [];
  if (contacts.phone) links.push({ kind: "phone", href: `tel:${contacts.phone}`, value: contacts.phone });
  if (contacts.whatsapp) links.push({ kind: "whatsapp", href: `https://wa.me/${digits(contacts.whatsapp)}`, value: contacts.whatsapp });
  if (contacts.viber) links.push({ kind: "viber", href: `viber://chat?number=%2B${digits(contacts.viber)}`, value: contacts.viber });
  if (contacts.telegram) {
    const user = contacts.telegram.replace(/^@/, "");
    links.push({ kind: "telegram", href: `https://t.me/${user}`, value: `@${user}` });
  }
  if (contacts.email) links.push({ kind: "email", href: `mailto:${contacts.email}`, value: contacts.email });
  if (contacts.facebook) links.push({ kind: "facebook", href: contacts.facebook, value: contacts.facebook.replace(/^https?:\/\/(www\.)?/, "") });
  if (contacts.website) links.push({ kind: "website", href: contacts.website, value: contacts.website.replace(/^https?:\/\/(www\.)?/, "") });
  return links;
}
