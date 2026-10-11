"use client";

import { Briefcase, Images, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", key: "profile", icon: UserRound },
  { href: "/dashboard/services", key: "services", icon: Briefcase },
  { href: "/dashboard/portfolio", key: "portfolio", icon: Images },
  { href: "/dashboard/account", key: "account", icon: Settings },
] as const;

export function DashboardNav({ active }: { active?: string }) {
  const t = useTranslations("dashboard.nav");
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:grid lg:px-0">
      {ITEMS.map(({ href, key, icon: Icon }) => {
        const isActive = active === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              isActive ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4.5" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Needs the URL, so it renders inside <Suspense> with a plain <DashboardNav /> as fallback. */
export function ActiveDashboardNav() {
  const pathname = usePathname();
  const active = ITEMS.map((i) => i.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return <DashboardNav active={active} />;
}
