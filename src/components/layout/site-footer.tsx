import { useTranslations } from "next-intl";
import { cacheLife } from "next/cache";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="grid max-w-sm content-start gap-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">{t("footer.about")}</p>
          <LanguageSwitcher className="justify-self-start" />
        </div>
        <FooterColumn title={t("footer.clients")}>
          <Link href="/workers">{t("common.findWorker")}</Link>
          <Link href="/#categories">{t("nav.categories")}</Link>
          <Link href="/#how-it-works">{t("nav.howItWorks")}</Link>
        </FooterColumn>
        <FooterColumn title={t("footer.workers")}>
          <Link href="/auth/register">{t("footer.createProfile")}</Link>
          <Link href="/auth/login">{t("common.login")}</Link>
        </FooterColumn>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-5 text-xs text-muted-foreground">
          {t.rich("footer.rights", { year: () => <CurrentYear /> })}
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-3">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="grid gap-2 text-sm text-muted-foreground [&>a]:w-fit [&>a]:transition-colors [&>a:hover]:text-foreground">
        {children}
      </div>
    </div>
  );
}

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
