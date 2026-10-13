import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "@/components/workers/filter-panel";
import { Pagination } from "@/components/workers/pagination";
import { PendingArea, SearchShell } from "@/components/workers/search-shell";
import { SearchToolbar } from "@/components/workers/search-toolbar";
import { WorkerCard, WorkerCardSkeleton } from "@/components/workers/worker-card";
import { ResetFiltersButton } from "@/components/workers/reset-filters-button";
import { filtersToSearchParams, parseSearchParams } from "@/domain/schemas";
import { redirect } from "@/i18n/navigation";
import { getCategories, getCities, searchWorkers } from "@/lib/data/public";

export async function generateMetadata({ params }: PageProps<"/[locale]/workers">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("meta");
  return {
    title: t("workersTitle"),
    description: t("workersDescription"),
    // Every filter combination is the same page for search engines: point them at the unfiltered list.
    alternates: { canonical: locale === "ka" ? "/workers" : "/en/workers", languages: { ka: "/workers", en: "/en/workers" } },
  };
}

export default async function WorkersPage(props: PageProps<"/[locale]/workers">) {
  const t = await getTranslations("search");
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 grid gap-1">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {/* Search params are request data: everything that depends on them streams behind this boundary. */}
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: PageProps<"/[locale]/workers">["searchParams"] }) {
  const filters = parseSearchParams(await searchParams);
  const [t, categories, cities, results] = await Promise.all([
    getTranslations("search"),
    getCategories(),
    getCities(),
    searchWorkers(filters),
  ]);

  // A page past the end (stale link, results shrank) would show "no results" under a non-zero count.
  const lastPage = Math.max(1, Math.ceil(results.total / filters.pageSize));
  if (filters.page > lastPage) {
    const query = filtersToSearchParams({ ...filters, page: lastPage }).toString();
    redirect({ href: query ? `/workers?${query}` : "/workers", locale: await getLocale() });
  }

  return (
    <SearchShell filters={filters}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <Card className="p-5">
            <FilterPanel categories={categories} cities={cities} />
          </Card>
        </aside>

        <div className="grid min-w-0 content-start gap-6">
          <SearchToolbar categories={categories} cities={cities} total={results.total} />
          <PendingArea>
            {results.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.items.map((worker, i) => (
                  <WorkerCard key={worker.id} worker={worker} categories={categories} cities={cities} priority={i < 3} />
                ))}
              </div>
            ) : (
              <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
                  <SearchX className="size-7" />
                </span>
                <h2 className="text-xl font-bold">{t("emptyTitle")}</h2>
                <p className="max-w-md text-muted-foreground">{t("emptyText")}</p>
                <ResetFiltersButton />
              </div>
            )}
            <Pagination filters={filters} total={results.total} />
          </PendingArea>
        </div>
      </div>
    </SearchShell>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_1fr]">
      <Skeleton className="hidden h-[32rem] rounded-2xl lg:block" />
      <div className="grid content-start gap-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WorkerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
