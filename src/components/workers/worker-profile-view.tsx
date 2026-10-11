import { ArrowLeft, Briefcase, Images, MapPin } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Category, WorkerProfile } from "@/domain/models";
import { Link } from "@/i18n/navigation";
import { localized } from "@/i18n/localized";
import { CategoryIcon } from "./category-icon";
import { ContactButtons, MobileContactBar } from "./contact-buttons";
import { PortfolioGallery } from "./portfolio-gallery";
import { PriceTag } from "./price-tag";
import { ShareButton } from "./share-button";

/** Public profile page body. Also used for the owner's draft preview in the dashboard. */
export function WorkerProfileView({ worker, categories }: { worker: WorkerProfile; categories: Category[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();
  const cover = worker.portfolio[0]?.image.url;

  return (
    <div className="pb-28 lg:pb-16">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-hero-from to-hero-to sm:h-56">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-40 blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        <div className="container-page relative pt-4">
          <Link
            href="/workers"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/40"
          >
            <ArrowLeft className="size-4" /> {t("profile.backToSearch")}
          </Link>
        </div>
      </div>

      <div className="container-page -mt-16 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="grid min-w-0 content-start gap-8">
          {/* Header */}
          <header className="grid gap-4">
            <Avatar name={worker.fullName} src={worker.avatar?.url} className="size-28 border-4 border-background text-3xl shadow-lift sm:size-32" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-2">
                <h1 className="text-3xl font-extrabold sm:text-4xl">{worker.fullName}</h1>
                {worker.headline && <p className="text-lg text-muted-foreground">{worker.headline}</p>}
              </div>
              <ShareButton title={worker.fullName} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {worker.cities.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" />
                  {worker.cities.map((c) => localized(c.name, locale)).join(", ")}
                </span>
              )}
              {worker.yearsExperience != null && worker.yearsExperience > 0 && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-4 text-primary" />
                  {t("common.yearsExperience", { count: worker.yearsExperience })}
                </span>
              )}
              {worker.portfolio.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Images className="size-4 text-primary" />
                  {t("common.photos", { count: worker.portfolio.length })}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {worker.categories.map((c) => (
                <Link key={c.slug} href={`/workers?category=${c.slug}`}>
                  <Badge size="md" className="hover:bg-primary-soft/70">
                    <CategoryIcon icon={c.icon} />
                    {localized(c.name, locale)}
                  </Badge>
                </Link>
              ))}
            </div>
          </header>

          {/* Contact card on small screens sits right under the header */}
          <ContactCard worker={worker} className="lg:hidden" />

          {worker.portfolio.length > 0 && (
            <Section title={t("profile.portfolio")}>
              <PortfolioGallery images={worker.portfolio} workerName={worker.fullName} />
            </Section>
          )}

          <Section title={t("profile.services")}>
            {worker.services.length > 0 ? (
              <Card className="divide-y divide-border">
                {worker.services.map((s) => {
                  const category = categories.find((c) => c.id === s.categoryId);
                  return (
                    <div key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-5">
                      <div className="grid gap-1">
                        <h3 className="font-semibold">{s.title}</h3>
                        {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                        {category && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CategoryIcon icon={category.icon} className="size-3.5" /> {localized(category.name, locale)}
                          </span>
                        )}
                      </div>
                      <PriceTag
                        priceFrom={s.priceFrom}
                        priceTo={s.priceTo}
                        unit={s.priceUnit}
                        currency={s.currency}
                        className="shrink-0 text-lg font-bold text-primary"
                      />
                    </div>
                  );
                })}
              </Card>
            ) : (
              <p className="text-muted-foreground">{t("profile.noServices")}</p>
            )}
          </Section>

          <Section title={t("profile.about")}>
            <p className="leading-relaxed whitespace-pre-line text-foreground/90">{worker.bio || t("profile.noBio")}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              {t("profile.updated", { date: format.dateTime(new Date(worker.updatedAt), { dateStyle: "medium" }) })}
            </p>
          </Section>
        </div>

        <aside className="hidden lg:block">
          <ContactCard worker={worker} className="sticky top-24" />
        </aside>
      </div>

      <MobileContactBar contacts={worker.contacts} />
    </div>
  );
}

function ContactCard({ worker, className }: { worker: WorkerProfile; className?: string }) {
  const t = useTranslations("profile");
  return (
    <Card className={`p-5 ${className ?? ""}`}>
      <h2 className="text-lg font-bold">{t("contactTitle", { name: worker.fullName.split(" ")[0] })}</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">{t("contactHint")}</p>
      <ContactButtons contacts={worker.contacts} />
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
