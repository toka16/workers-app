import { Globe, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { ContactInfo } from "@/domain/models";
import { formatPhoneForDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FacebookIcon, TelegramIcon, ViberIcon, WhatsAppIcon } from "./brand-icons";
import { contactLinks, type ContactKind } from "./contact-links";

/**
 * Messenger buttons keep their brand hue, darkened (see --brand-* tokens) so the white label passes AA;
 * everything else reuses the shared button variants.
 */
const STYLE: Record<ContactKind, { icon: ComponentType<SVGProps<SVGSVGElement>>; variant: "primary" | "outline"; brand?: string }> = {
  phone: { icon: Phone, variant: "primary" },
  whatsapp: { icon: WhatsAppIcon, variant: "primary", brand: "bg-brand-whatsapp text-white hover:bg-brand-whatsapp-hover" },
  viber: { icon: ViberIcon, variant: "primary", brand: "bg-brand-viber text-white hover:bg-brand-viber-hover" },
  telegram: { icon: TelegramIcon, variant: "primary", brand: "bg-brand-telegram text-white hover:bg-brand-telegram-hover" },
  email: { icon: Mail, variant: "outline" },
  facebook: { icon: FacebookIcon, variant: "outline" },
  website: { icon: Globe, variant: "outline" },
};

const contactButton = (kind: ContactKind, className?: string) =>
  cn(buttonVariants({ variant: STYLE[kind].variant, size: "lg" }), "rounded-xl", STYLE[kind].brand, className);

const external = (kind: ContactKind) => kind === "facebook" || kind === "website" || kind === "whatsapp" || kind === "telegram";

export function ContactButtons({ contacts, className }: { contacts: ContactInfo; className?: string }) {
  const t = useTranslations("profile");
  const links = contactLinks(contacts);
  return (
    <div className={cn("grid gap-2.5", className)}>
      {links.map(({ kind, href, value }) => {
        const Icon = STYLE[kind].icon;
        return (
          <a
            key={kind}
            href={href}
            {...(external(kind) ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
            className={contactButton(kind, "h-auto min-h-12 justify-start gap-3 px-4 py-2.5")}
          >
            <Icon className="size-5 shrink-0" />
            <span className="grid min-w-0 text-left leading-tight">
              <span>{kind === "phone" ? t("call") : t(kind)}</span>
              <span className="truncate text-xs font-normal">
                {kind === "phone" || kind === "whatsapp" || kind === "viber" ? formatPhoneForDisplay(value) : value}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

/**
 * Thumb-reachable call / chat bar for phones. Render it as the last child of the profile body: it is sticky,
 * so it follows the viewport while the profile scrolls by and then settles above the footer instead of covering it.
 * `inline` drops the stickiness (dashboard preview, where the page has its own chrome).
 */
export function MobileContactBar({ contacts, inline = false }: { contacts: ContactInfo; inline?: boolean }) {
  const t = useTranslations("profile");
  const links = contactLinks(contacts).filter((l) => l.kind !== "facebook" && l.kind !== "website");
  const primary = links.slice(0, 2);
  if (!primary.length) return null;
  return (
    <div
      className={cn(
        "border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden",
        inline ? "relative" : "sticky bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="flex gap-2">
        {primary.map(({ kind, href }) => {
          const Icon = STYLE[kind].icon;
          return (
            <a
              key={kind}
              href={href}
              {...(external(kind) ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
              className={contactButton(kind, "min-w-0 flex-1 px-3")}
            >
              <Icon className="size-5" />
              <span className="truncate">{kind === "phone" ? t("call") : t(kind)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
