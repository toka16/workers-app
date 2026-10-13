"use client";

import { createContext, use, useCallback, useEffect, useRef, useTransition, type ReactNode } from "react";
import type { SearchFilters } from "@/domain/models";
import { filtersToSearchParams } from "@/domain/schemas";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SearchContextValue {
  filters: SearchFilters;
  pending: boolean;
  /**
   * Discrete changes (checkboxes, sort, chips) push a history entry so Back undoes them; pass
   * `{ replace: true }` for typing, where every pause would otherwise flood the history.
   */
  update: (patch: Partial<SearchFilters> | ((latest: SearchFilters) => Partial<SearchFilters>), options?: { replace?: boolean }) => void;
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

  // The latest requested filters. Debounced inputs fire after a delay, and a change made in the meantime
  // (e.g. a category toggled while the URL is still updating) must not be reverted by stale props.
  const latest = useRef(filters);
  useEffect(() => {
    latest.current = filters;
  }, [filters]);

  const navigate = useCallback(
    (next: SearchFilters, replace = false) => {
      latest.current = next;
      const query = filtersToSearchParams(next).toString();
      const href = query ? `/workers?${query}` : "/workers";
      startTransition(() => (replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false })));
    },
    [router],
  );

  const value: SearchContextValue = {
    filters,
    pending,
    // Any filter change starts again from page 1.
    update: (patch, options) => {
      const base = latest.current;
      navigate({ ...base, page: 1, ...(typeof patch === "function" ? patch(base) : patch) }, options?.replace);
    },
    reset: () => navigate({ ...latest.current, page: 1, categories: [], cities: [], priceMax: null, minExperience: null, withPhotos: false }),
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
