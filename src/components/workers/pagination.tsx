import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SearchFilters } from "@/domain/models";
import { filtersToSearchParams } from "@/domain/schemas";
import { Link } from "@/i18n/navigation";

export function Pagination({ filters, total }: { filters: SearchFilters; total: number }) {
  const t = useTranslations("search");
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  if (pages <= 1) return null;
  const href = (page: number) => {
    const query = filtersToSearchParams({ ...filters, page }).toString();
    return query ? `/workers?${query}` : "/workers";
  };
  return (
    <nav className="flex items-center justify-between gap-3 pt-4" aria-label="pagination">
      {filters.page > 1 ? (
        <Button asChild variant="outline">
          <Link href={href(filters.page - 1)}>
            <ChevronLeft /> {t("previous")}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">{t("page", { page: filters.page, total: pages })}</span>
      {filters.page < pages ? (
        <Button asChild variant="outline">
          <Link href={href(filters.page + 1)}>
            {t("next")} <ChevronRight />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
