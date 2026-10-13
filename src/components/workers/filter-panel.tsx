"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Category, City } from "@/domain/models";
import { countActiveFilters } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { useSearch } from "./search-shell";

const EXPERIENCE_OPTIONS = [1, 3, 5, 10];

export function FilterPanel({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const { filters, update, reset } = useSearch();
  const id = useId();
  const [price, setPrice] = useState(filters.priceMax?.toString() ?? "");

  // Keep the input in sync when filters change elsewhere (chips, reset, back button), but not when the
  // URL merely catches up with the value we sent: digits typed since then must survive.
  const [syncedPrice, setSyncedPrice] = useState(filters.priceMax);
  const [sentPrice, setSentPrice] = useState(filters.priceMax);
  if (syncedPrice !== filters.priceMax) {
    setSyncedPrice(filters.priceMax);
    if (filters.priceMax !== sentPrice) {
      setSentPrice(filters.priceMax);
      setPrice(filters.priceMax?.toString() ?? "");
    }
  }

  // Debounce typing in the price field.
  useEffect(() => {
    const value = price.trim() === "" ? null : Number.parseInt(price, 10);
    if (value === sentPrice || (value !== null && Number.isNaN(value))) return;
    const timer = setTimeout(() => {
      setSentPrice(value);
      update({ priceMax: value }, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [price]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (list: string[], slug: string) =>
    list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];

  const selectedNames = <T extends Category | City>(items: T[], slugs: string[]) =>
    items.filter((i) => slugs.includes(i.slug)).map((i) => localized(i.name, locale));

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <FilterDropdown
          title={t("categories")}
          selected={selectedNames(categories, filters.categories)}
          emptyLabel={t("allServices")}
        >
          {categories.map((c) => (
            <label key={c.slug} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
              <Checkbox
                checked={filters.categories.includes(c.slug)}
                onChange={() => update((f) => ({ categories: toggle(f.categories, c.slug) }))}
              />
              <CategoryIcon icon={c.icon} className="size-4 text-primary" />
              {localized(c.name, locale)}
            </label>
          ))}
        </FilterDropdown>

        <FilterDropdown title={t("cities")} selected={selectedNames(cities, filters.cities)} emptyLabel={t("allCities")}>
          <div className="grid grid-cols-2 lg:grid-cols-1">
            {cities.map((c) => (
              <label key={c.slug} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                <Checkbox
                  checked={filters.cities.includes(c.slug)}
                  onChange={() => update((f) => ({ cities: toggle(f.cities, c.slug) }))}
                />
                {localized(c.name, locale)}
              </label>
            ))}
          </div>
        </FilterDropdown>
      </div>

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

/**
 * Collapsible section: closed it shows a one-line summary of the selection, open it shows the full list
 * inline (no inner scroll area, so the page or sheet is the only thing that scrolls).
 */
function FilterDropdown({
  title,
  selected,
  emptyLabel,
  children,
}: {
  title: string;
  selected: string[];
  emptyLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors hover:bg-muted/60"
      >
        <span className="grid min-w-0 flex-1">
          <span className="text-sm font-semibold">{title}</span>
          <span className={cn("truncate text-sm", selected.length ? "text-primary" : "text-muted-foreground")}>
            {selected.length ? selected.join(", ") : emptyLabel}
          </span>
        </span>
        {selected.length > 0 && (
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <fieldset id={contentId} className="grid gap-0.5 border-t border-border p-1.5">
          <legend className="sr-only">{title}</legend>
          {children}
        </fieldset>
      )}
    </div>
  );
}
