import { ArrowRight, BadgeCheck, Camera, CheckCircle2, Coins, MessageCircle, PhoneCall, Search, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { HeroCollage, type CollageWorker } from "@/components/landing/hero-collage";
import { HeroSearch } from "@/components/landing/hero-search";
import { Reveal } from "@/components/landing/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/workers/category-icon";
import { WorkerCard } from "@/components/workers/worker-card";
import { localized } from "@/i18n/localized";
import { Link } from "@/i18n/navigation";
import { getCategories, getCities, getFeaturedWorkers, getStats } from "@/lib/data/public";
import { formatMoney } from "@/lib/format";

export default async function LandingPage() {
  const [t, locale, categories, cities, featured, stats] = await Promise.all([
    getTranslations(),
    getLocale(),
    getCategories(),
    getCities(),
    getFeaturedWorkers(6),
    getStats(),
  ]);

  const collage: CollageWorker[] = featured.slice(0, 3).map((w) => ({
    slug: w.slug,
    name: w.fullName,
    headline: w.headline,
    avatarUrl: w.avatar?.url ?? null,
    coverUrl: w.cover?.url ?? null,
    city: localized(cities.find((c) => c.slug === w.citySlugs[0])?.name ?? { ka: "", en: "" }, locale),
    price: w.minPrice != null ? t("common.priceFrom", { price: formatMoney(w.minPrice, w.currency ?? "GEL", locale) }) : null,
  }));

  const popular = categories.slice(0, 4);

  return (
    <>
      {/* ------------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-hero-from via-hero-to to-hero-from text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        />
        <div aria-hidden className="absolute -top-32 -right-24 -z-10 size-[28rem] rounded-full bg-accent/30 blur-[110px]" />
        <div aria-hidden className="absolute -bottom-40 -left-24 -z-10 size-[30rem] rounded-full bg-primary/60 blur-[120px]" />

        <div className="container-page grid items-center gap-10 pt-12 pb-24 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pt-20 lg:pb-32">
          <div className="grid gap-7">
            <Badge variant="glass" size="md" className="w-fit animate-fade-up">
              <BadgeCheck className="text-accent" /> {t("landing.badge")}
            </Badge>
            <h1 className="animate-fade-up text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl [animation-delay:60ms]">
              {t("landing.titleStart")}{" "}
              <span className="bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">
                {t("landing.titleHighlight")}
              </span>
            </h1>
            <p className="max-w-xl animate-fade-up text-lg leading-relaxed text-white/80 [animation-delay:120ms]">
              {t("landing.subtitle")}
            </p>
            <div className="animate-fade-up [animation-delay:180ms]">
              <HeroSearch categories={categories} cities={cities} />
            </div>
            <div className="flex animate-fade-up flex-wrap items-center gap-2 text-sm text-white/75 [animation-delay:240ms]">
              <span>{t("landing.popular")}</span>
              {popular.map((c) => (
                <Link
                  key={c.slug}
                  href={`/workers?category=${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
                >
                  <CategoryIcon icon={c.icon} className="size-3.5" />
                  {localized(c.name, locale)}
                </Link>
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/85">
              {[t("landing.trust1"), t("landing.trust2"), t("landing.trust3")].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-accent" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroCollage workers={collage} />
        </div>
      </section>

      {/* ------------------------------------------------------------------ Stats */}
      <section className="container-page relative z-10 -mt-12">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-lift md:grid-cols-4">
          {[
            { value: stats.workers, label: t("landing.statsWorkers"), icon: Users },
            { value: stats.cities, label: t("landing.statsCities"), icon: Search },
            { value: stats.categories, label: t("landing.statsCategories"), icon: BadgeCheck },
            { value: "0 ₾", label: t("landing.statsFee"), icon: Coins },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 bg-surface p-4 sm:p-6">
              <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:grid">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ Categories */}
      <section id="categories" className="container-page scroll-mt-20 py-20 sm:py-24">
        <SectionHeading title={t("landing.categoriesTitle")} subtitle={t("landing.categoriesSubtitle")}>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/workers">
              {t("landing.viewAll")} <ArrowRight />
            </Link>
          </Button>
        </SectionHeading>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={Math.min(i, 8) * 0.03}>
              <Link
                href={`/workers?category=${c.slug}`}
                className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift sm:p-5"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-12">
                  <CategoryIcon icon={c.icon} className="size-5 sm:size-6" />
                </span>
                <span className="text-sm leading-snug font-semibold sm:text-base">{localized(c.name, locale)}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-surface py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading title={t("landing.howTitle")} subtitle={t("landing.howSubtitle")} centered />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: t("landing.step1Title"), text: t("landing.step1Text") },
              { icon: Camera, title: t("landing.step2Title"), text: t("landing.step2Text") },
              { icon: PhoneCall, title: t("landing.step3Title"), text: t("landing.step3Text") },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <li className="relative h-full rounded-2xl bg-background p-6 ring-1 ring-border">
                  <span className="absolute top-5 right-6 font-display text-5xl font-extrabold text-primary/10">
                    0{i + 1}
                  </span>
                  <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-hero-from text-white shadow-soft">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ Featured workers */}
      {featured.length > 0 && (
        <section className="container-page py-20 sm:py-24">
          <SectionHeading title={t("landing.featuredTitle")} subtitle={t("landing.featuredSubtitle")}>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/workers">
                {t("landing.viewAll")} <ArrowRight />
              </Link>
            </Button>
          </SectionHeading>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((w, i) => (
              <Reveal key={w.id} delay={(i % 3) * 0.08}>
                <WorkerCard worker={w} categories={categories} cities={cities} className="h-full" />
              </Reveal>
            ))}
          </div>
          <Button asChild variant="outline" size="lg" className="mt-8 w-full sm:hidden">
            <Link href="/workers">
              {t("landing.viewAll")} <ArrowRight />
            </Link>
          </Button>
        </section>
      )}

      {/* ------------------------------------------------------------------ Worker CTA */}
      <section className="container-page pb-20 sm:pb-24">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-hero-from to-hero-to px-6 py-12 text-white shadow-lift sm:px-12 sm:py-16">
            <div aria-hidden className="absolute -top-24 -right-16 -z-10 size-80 rounded-full bg-accent/35 blur-[90px]" />
            <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div className="grid gap-5">
                <h2 className="text-3xl font-extrabold sm:text-4xl">{t("landing.ctaTitle")}</h2>
                <p className="max-w-xl text-lg text-white/80">{t("landing.ctaSubtitle")}</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="accent" size="xl">
                    <Link href="/auth/register">
                      {t("landing.ctaButton")} <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="glass" size="xl">
                    <Link href="/auth/login">{t("common.login")}</Link>
                  </Button>
                </div>
              </div>
              <ul className="grid gap-3">
                {[
                  { icon: Users, text: t("landing.ctaBenefit1") },
                  { icon: Camera, text: t("landing.ctaBenefit2") },
                  { icon: MessageCircle, text: t("landing.ctaBenefit3") },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 font-semibold ring-1 ring-white/15 backdrop-blur">
                    <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function SectionHeading({
  title,
  subtitle,
  centered,
  children,
}: {
  title: string;
  subtitle: string;
  centered?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "flex items-end justify-between gap-6"}>
      <div className="grid gap-2">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
