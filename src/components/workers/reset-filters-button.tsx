"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSearch } from "./search-shell";

export function ResetFiltersButton() {
  const t = useTranslations("search");
  const { reset, update, filters } = useSearch();
  return (
    <Button variant="outline" onClick={() => (filters.q ? update({ q: "", categories: [], cities: [], priceMax: null, minExperience: null, withPhotos: false }) : reset())}>
      <RotateCcw /> {t("reset")}
    </Button>
  );
}
