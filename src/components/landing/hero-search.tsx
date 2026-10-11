"use client";

import { MapPin, Search, Wrench } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Category, City } from "@/domain/models";
import { filtersToSearchParams } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { useRouter } from "@/i18n/navigation";

export function HeroSearch({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const query = filtersToSearchParams({
      categories: category ? [category] : [],
      cities: city ? [city] : [],
    }).toString();
    router.push(query ? `/workers?${query}` : "/workers");
  }

  const selectClass =
    "h-12 w-full appearance-none rounded-xl bg-transparent pr-3 pl-10 text-base font-medium text-foreground outline-none sm:text-sm";

  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-2xl bg-surface p-2 shadow-lift ring-1 ring-black/5 sm:grid-cols-[1fr_1fr_auto] sm:gap-0 sm:divide-x sm:divide-border"
    >
      <label className="relative flex items-center rounded-xl bg-muted/60 sm:bg-transparent">
        <Wrench className="pointer-events-none absolute left-3.5 size-5 text-primary" aria-hidden />
        <span className="sr-only">{t("categoryPlaceholder")}</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {localized(c.name, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="relative flex items-center rounded-xl bg-muted/60 sm:bg-transparent">
        <MapPin className="pointer-events-none absolute left-3.5 size-5 text-primary" aria-hidden />
        <span className="sr-only">{t("cityPlaceholder")}</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
          <option value="">{t("allCities")}</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {localized(c.name, locale)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="accent" size="lg" className="h-12 rounded-xl sm:ml-2 sm:px-8">
        <Search className="size-5" />
        {tc("search")}
      </Button>
    </form>
  );
}
