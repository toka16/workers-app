"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = { ka: "ქარ", en: "ENG" };

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: string) {
    // Read the URL at click time instead of usePathname/useSearchParams: those hooks would make
    // every page that renders the header depend on request data and block prerendering.
    const { pathname, search } = window.location;
    const prefix = `/${locale}`;
    const path = pathname === prefix || pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) || "/" : pathname;
    startTransition(() => router.replace(`${path}${search}`, { locale: next, scroll: false }));
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-semibold", pending && "opacity-60", className)}
    >
      <Languages className="mx-1.5 size-3.5 text-muted-foreground" aria-hidden />
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== locale && switchTo(l)}
          aria-pressed={l === locale}
          className={cn(
            "rounded-full px-2.5 py-1.5 transition-colors",
            l === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[l] ?? l}
        </button>
      ))}
    </div>
  );
}
