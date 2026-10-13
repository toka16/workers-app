import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ConfirmedToast } from "@/components/dashboard/confirmed-toast";
import { ActiveDashboardNav, DashboardNav } from "@/components/dashboard/dashboard-nav";
import { EditorGuardProvider } from "@/components/dashboard/profile-editor/editor-guard";
import { ProfileStatusPill } from "@/components/dashboard/profile-status-pill";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("common"))("dashboard"), robots: { index: false } };
}

export default function DashboardLayout({ children }: LayoutProps<"/[locale]/dashboard">) {
  const t = useTranslations("nav");
  return (
    // The guard sits above the header and sidebar so every way out of an unsaved step asks first.
    <EditorGuardProvider>
      <div className="flex min-h-dvh flex-col bg-muted/40">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {t("skipToContent")}
        </a>
        <ConfirmedToast />
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-lg">
          <div className="container-page flex h-16 items-center gap-3">
            <Logo />
            <div className="ml-auto flex items-center gap-2">
              <Suspense fallback={null}>
                <ProfileStatusPill />
              </Suspense>
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <SignOutButton compact />
            </div>
          </div>
        </header>

        <div className="container-page grid grid-cols-1 flex-1 gap-6 py-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:py-10">
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
    </EditorGuardProvider>
  );
}
