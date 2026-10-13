import { Briefcase, Images, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, City, WorkerSummary } from "@/domain/models";
import { Link } from "@/i18n/navigation";
import { localized } from "@/i18n/localized";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { PriceTag } from "./price-tag";

interface WorkerCardProps {
  worker: WorkerSummary;
  categories: Category[];
  cities: City[];
  className?: string;
  priority?: boolean;
}

export function WorkerCard({ worker, categories, cities, className, priority }: WorkerCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const workerCategories = worker.categorySlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is Category => Boolean(c));
  const cityNames = worker.citySlugs
    .map((slug) => cities.find((c) => c.slug === slug))
    .filter((c): c is City => Boolean(c))
    .map((c) => localized(c.name, locale));

  return (
    <Link
      href={`/workers/${worker.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary-soft to-accent-soft">
        {worker.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={worker.cover.url}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-primary/40">
            <CategoryIcon icon={workerCategories[0]?.icon ?? "wrench"} className="size-14" strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {worker.photoCount > 0 && (
          <Badge variant="overlay" className="absolute top-3 right-3">
            <Images /> {worker.photoCount}
          </Badge>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-4 pt-0">
        <div className="-mt-8 flex items-end gap-3">
          <Avatar name={worker.fullName} src={worker.avatar?.url} className="size-16 border-4 border-surface text-lg shadow-soft" />
          {worker.yearsExperience != null && worker.yearsExperience > 0 && (
            <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Briefcase className="size-3.5" />
              {t("common.yearsExperience", { count: worker.yearsExperience })}
            </span>
          )}
        </div>

        <div className="grid gap-1">
          <h3 className="text-lg leading-snug font-bold group-hover:text-primary">{worker.fullName}</h3>
          {worker.headline && <p className="line-clamp-2 text-sm text-muted-foreground">{worker.headline}</p>}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {workerCategories.slice(0, 2).map((c) => (
            <Badge key={c.slug} variant="primary">
              <CategoryIcon icon={c.icon} />
              {localized(c.name, locale)}
            </Badge>
          ))}
          {workerCategories.length > 2 && (
            <Badge variant="muted">{t("common.moreCount", { count: workerCategories.length - 2 })}</Badge>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{cityNames.join(", ")}</span>
          </span>
          <PriceTag
            compact
            priceFrom={worker.minPrice}
            currency={worker.currency}
            className="shrink-0 font-bold text-foreground"
          />
        </div>
      </div>
    </Link>
  );
}

export function WorkerCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="grid gap-3 p-4">
        <Skeleton className="-mt-12 size-16 rounded-full border-4 border-surface" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
