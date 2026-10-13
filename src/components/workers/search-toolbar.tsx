"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { SORT_OPTIONS, type Category, type City } from "@/domain/models";
import { countActiveFilters } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { formatMoney } from "@/lib/format";
import { FilterPanel } from "./filter-panel";
import { useSearch } from "./search-shell";

export function SearchToolbar({ categories, cities, total }: { categories: Category[]; cities: City[]; total: number }) {
  const t = useTranslations("search");
  const { filters, update } = useSearch();
  const [q, setQ] = useState(filters.q);
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);

  // Follow the URL when the query changes elsewhere (chips, reset, Back), but not when the URL merely
  // catches up with what we sent: the user may have kept typing since, and that text must survive.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  const [sentQ, setSentQ] = useState(filters.q);
  if (syncedQ !== filters.q) {
    setSyncedQ(filters.q);
    if (filters.q !== sentQ) {
      setSentQ(filters.q);
      setQ(filters.q);
    }
  }
  useEffect(() => {
    const value = q.trim();
    if (value === sentQ) return;
    const timer = setTimeout(() => {
      setSentQ(value);
      update({ q: value }, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("queryPlaceholder")}
            aria-label={t("queryPlaceholder")}
            className="h-12 pl-11 text-base"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="relative h-12 lg:hidden" aria-label={t("filters")}>
              <SlidersHorizontal className="size-5" />
              <span className="hidden sm:inline">{t("filters")}</span>
              {active > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {active}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent side="bottom" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{t("filters")}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <FilterPanel categories={categories} cities={cities} />
            </DialogBody>
            <DialogFooter>
              <Button size="lg" onClick={() => setOpen(false)} className="w-full">
                {t("showResults")} ({total})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {t("results", { count: total })}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("sortLabel")}</span>
          <NativeSelect
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as (typeof SORT_OPTIONS)[number] })}
            className="h-9 w-auto py-0 font-medium"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>

      <ActiveFilterChips categories={categories} cities={cities} />
    </div>
  );
}

function ActiveFilterChips({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const { filters, update } = useSearch();

  const chips = [
    ...filters.categories.map((slug) => ({
      key: `c-${slug}`,
      label: localized(categories.find((c) => c.slug === slug)?.name ?? { ka: slug, en: slug }, locale),
      remove: () => update({ categories: filters.categories.filter((s) => s !== slug) }),
    })),
    ...filters.cities.map((slug) => ({
      key: `l-${slug}`,
      label: localized(cities.find((c) => c.slug === slug)?.name ?? { ka: slug, en: slug }, locale),
      remove: () => update({ cities: filters.cities.filter((s) => s !== slug) }),
    })),
    ...(filters.priceMax != null
      ? [{ key: "price", label: `≤ ${formatMoney(filters.priceMax, "GEL", locale)}`, remove: () => update({ priceMax: null }) }]
      : []),
    ...(filters.minExperience != null
      ? [{ key: "exp", label: t("experienceAtLeast", { years: filters.minExperience }), remove: () => update({ minExperience: null }) }]
      : []),
    ...(filters.withPhotos ? [{ key: "photos", label: t("withPhotos"), remove: () => update({ withPhotos: false }) }] : []),
  ];

  if (!chips.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft py-1.5 pr-2 pl-3 text-sm font-medium text-primary-soft-foreground transition-colors hover:bg-primary-soft/70"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden />
          <span className="sr-only">{t("removeFilter")}</span>
        </button>
      ))}
    </div>
  );
}
