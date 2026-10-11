"use client";

import { RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Category, City } from "@/domain/models";
import { countActiveFilters } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { CategoryIcon } from "./category-icon";
import { useSearch } from "./search-shell";

const EXPERIENCE_OPTIONS = [1, 3, 5, 10];

export function FilterPanel({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const { filters, update, reset } = useSearch();
  const id = useId();
  const [price, setPrice] = useState(filters.priceMax?.toString() ?? "");

  // Keep the input in sync when filters change elsewhere (chips, reset, back button).
  const [syncedPrice, setSyncedPrice] = useState(filters.priceMax);
  if (syncedPrice !== filters.priceMax) {
    setSyncedPrice(filters.priceMax);
    setPrice(filters.priceMax?.toString() ?? "");
  }

  // Debounce typing in the price field.
  useEffect(() => {
    const value = price.trim() === "" ? null : Number.parseInt(price, 10);
    if (value === filters.priceMax || (value !== null && Number.isNaN(value))) return;
    const timer = setTimeout(() => update({ priceMax: value }), 500);
    return () => clearTimeout(timer);
  }, [price]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (list: string[], slug: string) =>
    list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];

  return (
    <div className="grid gap-7">
      <FilterGroup title={t("categories")}>
        <div className="grid gap-0.5 pr-1 lg:max-h-72 lg:overflow-y-auto">
          {categories.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
              <Checkbox
                checked={filters.categories.includes(c.slug)}
                onChange={() => update({ categories: toggle(filters.categories, c.slug) })}
              />
              <CategoryIcon icon={c.icon} className="size-4 text-primary" />
              {localized(c.name, locale)}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t("cities")}>
        <div className="grid grid-cols-2 gap-0.5 pr-1 lg:max-h-64 lg:grid-cols-1 lg:overflow-y-auto">
          {cities.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
              <Checkbox
                checked={filters.cities.includes(c.slug)}
                onChange={() => update({ cities: toggle(filters.cities, c.slug) })}
              />
              {localized(c.name, locale)}
            </label>
          ))}
        </div>
      </FilterGroup>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-price`}>{t("priceMax")}</Label>
        <div className="relative">
          <Input
            id={`${id}-price`}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t("priceMaxPlaceholder")}
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            className="pr-9"
          />
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">₾</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-exp`}>{t("experience")}</Label>
        <NativeSelect
          id={`${id}-exp`}
          value={filters.minExperience?.toString() ?? ""}
          onChange={(e) => update({ minExperience: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">{t("experienceAny")}</option>
          {EXPERIENCE_OPTIONS.map((years) => (
            <option key={years} value={years}>
              {t("experienceAtLeast", { years })}
            </option>
          ))}
        </NativeSelect>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
        {t("withPhotos")}
        <Switch checked={filters.withPhotos} onCheckedChange={(withPhotos) => update({ withPhotos })} />
      </label>

      {countActiveFilters(filters) > 0 && (
        <Button variant="ghost" onClick={reset} className="justify-self-start text-muted-foreground">
          <RotateCcw /> {t("reset")}
        </Button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}
