import { Camera, CheckCircle2, PhoneCall, UserRoundCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[1fr_minmax(0,36rem)]">
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4 sm:p-6">
          <Logo />
          <LanguageSwitcher />
        </header>
        <main id="main" className="flex flex-1 items-center justify-center px-4 pt-4 pb-16 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
      <AuthAside />
    </div>
  );
}

function AuthAside() {
  const t = useTranslations("auth");
  const tl = useTranslations("landing");
  return (
    <aside className="relative isolate hidden overflow-hidden bg-gradient-to-br from-hero-from to-hero-to p-12 text-white lg:flex lg:flex-col lg:justify-center">
      <div aria-hidden className="absolute -top-20 -right-20 -z-10 size-96 rounded-full bg-accent/30 blur-[100px]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-10 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <h2 className="text-3xl leading-tight font-extrabold">{t("asideTitle")}</h2>
      <ul className="mt-8 grid gap-4">
        {[
          { icon: UserRoundCheck, text: t("asideBenefit1") },
          { icon: Camera, text: t("asideBenefit2") },
          { icon: PhoneCall, text: t("asideBenefit3") },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 font-medium ring-1 ring-white/15 backdrop-blur">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-10 flex items-center gap-2 text-sm text-white/70">
        <CheckCircle2 className="size-4 text-accent" /> {tl("badge")}
      </p>
    </aside>
  );
}
