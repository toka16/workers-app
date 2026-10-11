import { useLocale, useTranslations } from "next-intl";
import type { PriceUnit } from "@/domain/models";
import { formatMoney } from "@/lib/format";

interface PriceTagProps {
  priceFrom: number | null;
  priceTo?: number | null;
  unit?: PriceUnit;
  currency?: string | null;
  /** "from 20 ₾" style, used on cards. */
  compact?: boolean;
  className?: string;
}

export function PriceTag({ priceFrom, priceTo, unit = "fixed", currency, compact, className }: PriceTagProps) {
  const t = useTranslations();
  const locale = useLocale();
  if (priceFrom == null || unit === "negotiable") {
    return <span className={className}>{t("common.negotiable")}</span>;
  }
  const from = formatMoney(priceFrom, currency ?? "GEL", locale);
  const suffix = t(`priceSuffix.${unit}`);
  if (compact) return <span className={className}>{t("common.priceFrom", { price: from })}</span>;
  const range = priceTo != null && priceTo > priceFrom ? `${from} – ${formatMoney(priceTo, currency ?? "GEL", locale)}` : from;
  return (
    <span className={className}>
      {range}
      {suffix && <span className="font-normal text-muted-foreground">{suffix}</span>}
    </span>
  );
}
