"use client";

import { createContext, use, useCallback, useTransition, type ReactNode } from "react";
import type { SearchFilters } from "@/domain/models";
import { filtersToSearchParams } from "@/domain/schemas";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SearchContextValue {
  filters: SearchFilters;
  pending: boolean;
  update: (patch: Partial<SearchFilters>) => void;
  reset: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const ctx = use(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchShell>");
  return ctx;
}

/** Owns the URL: every filter change becomes a navigation, so results are shareable and survive reloads. */
export function SearchShell({ filters, children }: { filters: SearchFilters; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: Partial<SearchFilters>) => {
      const query = filtersToSearchParams(next).toString();
      startTransition(() => router.replace(query ? `/workers?${query}` : "/workers", { scroll: false }));
    },
    [router],
  );

  const value: SearchContextValue = {
    filters,
    pending,
    // Any filter change starts again from page 1.
    update: (patch) => navigate({ ...filters, page: 1, ...patch }),
    reset: () => navigate({ q: filters.q, sort: filters.sort }),
  };

  return <SearchContext value={value}>{children}</SearchContext>;
}

export function PendingArea({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useSearch();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)}>
      {children}
    </div>
  );
}
