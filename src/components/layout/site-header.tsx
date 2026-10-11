import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AuthButtons } from "./auth-buttons";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <a
        href="#main"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("nav.skipToContent")}
      </a>
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        {/* Full header from xl: the Georgian labels need ~1030px; narrower screens use the menu. */}
        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground xl:flex">
          <Link href="/workers" className="rounded-lg px-3 py-2 whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground">
            {t("nav.workers")}
          </Link>
          <Link href="/#categories" className="rounded-lg px-3 py-2 whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground">
            {t("nav.categories")}
          </Link>
          <Link href="/#how-it-works" className="rounded-lg px-3 py-2 whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground">
            {t("nav.howItWorks")}
          </Link>
        </nav>
        <div className="ml-auto hidden items-center gap-3 xl:flex">
          <LanguageSwitcher />
          <AuthButtons />
        </div>
        <div className="ml-auto xl:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
