import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9", className)}>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-hero-from)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#logo-g)" />
      <path
        d="M11 19.5 20 12l9 7.5V28a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 11 28v-8.5Z"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="m16 22.5 3 3 5.5-6" fill="none" stroke="var(--color-accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-lg", className)}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
        {t("brand")}
      </span>
    </Link>
  );
}
