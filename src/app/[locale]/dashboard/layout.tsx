import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ActiveDashboardNav, DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("common"))("dashboard"), robots: { index: false } };
}

export default async function DashboardLayout({ children }: LayoutProps<"/[locale]/dashboard">) {
  const t = await getTranslations("dashboard.nav");
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-lg">
        <div className="container-page flex h-16 items-center gap-3">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard/preview">
                <ExternalLink /> {t("viewPublic")}
              </Link>
            </Button>
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <SignOutButton compact />
          </div>
        </div>
      </header>

      <div className="container-page grid flex-1 gap-6 py-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-26 lg:self-start">
          <Suspense fallback={<DashboardNav />}>
            <ActiveDashboardNav />
          </Suspense>
          <LanguageSwitcher className="mt-4 sm:hidden" />
        </aside>
        <main id="main" className="min-w-0 pb-16">
          {/* Pages read the session cookie and stream in behind their loading.tsx boundaries. */}
          {children}
        </main>
      </div>
    </div>
  );
}
