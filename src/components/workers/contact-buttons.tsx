import { Globe, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";
import type { ContactInfo } from "@/domain/models";
import { formatPhoneForDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FacebookIcon, TelegramIcon, ViberIcon, WhatsAppIcon } from "./brand-icons";
import { contactLinks, type ContactKind } from "./contact-links";

const STYLE: Record<ContactKind, { icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }> = {
  phone: { icon: Phone, className: "bg-primary text-primary-foreground hover:bg-primary-hover" },
  whatsapp: { icon: WhatsAppIcon, className: "bg-[#25D366] text-white hover:bg-[#1fb857]" },
  viber: { icon: ViberIcon, className: "bg-[#7360F2] text-white hover:bg-[#6150d8]" },
  telegram: { icon: TelegramIcon, className: "bg-[#229ED9] text-white hover:bg-[#1c8bc0]" },
  email: { icon: Mail, className: "border border-input bg-surface text-foreground hover:bg-muted" },
  facebook: { icon: FacebookIcon, className: "border border-input bg-surface text-foreground hover:bg-muted" },
  website: { icon: Globe, className: "border border-input bg-surface text-foreground hover:bg-muted" },
};

const external = (kind: ContactKind) => kind === "facebook" || kind === "website" || kind === "whatsapp" || kind === "telegram";

export function ContactButtons({ contacts, className }: { contacts: ContactInfo; className?: string }) {
  const t = useTranslations("profile");
  const links = contactLinks(contacts);
  return (
    <div className={cn("grid gap-2.5", className)}>
      {links.map(({ kind, href, value }) => {
        const { icon: Icon, className: style } = STYLE[kind];
        return (
          <a
            key={kind}
            href={href}
            {...(external(kind) ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
            className={cn("flex min-h-12 items-center gap-3 rounded-xl px-4 py-2.5 font-semibold transition-colors", style)}
          >
            <Icon className="size-5 shrink-0" />
            <span className="grid min-w-0 text-left leading-tight">
              <span>{kind === "phone" ? t("call") : t(kind)}</span>
              <span className="truncate text-xs font-normal opacity-85">
                {kind === "phone" || kind === "whatsapp" || kind === "viber" ? formatPhoneForDisplay(value) : value}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

/** Thumb-reachable call / chat bar for phones. */
export function MobileContactBar({ contacts }: { contacts: ContactInfo }) {
  const t = useTranslations("profile");
  const links = contactLinks(contacts).filter((l) => l.kind !== "facebook" && l.kind !== "website");
  const primary = links.slice(0, 2);
  if (!primary.length) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="flex gap-2">
        {primary.map(({ kind, href }) => {
          const { icon: Icon, className: style } = STYLE[kind];
          return (
            <a
              key={kind}
              href={href}
              {...(external(kind) ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
              className={cn("flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold", style)}
            >
              <Icon className="size-5" />
              {kind === "phone" ? t("call") : t(kind)}
            </a>
          );
        })}
      </div>
    </div>
  );
}
