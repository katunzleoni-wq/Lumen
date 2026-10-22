"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { categories, getCategoryName, type Book } from "@/content/books";
import type { Locale } from "@/i18n";
import { localeLabels, locales } from "@/i18n";
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filterBooks,
  type CatalogFilters,
  type CatalogSort,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookGrid } from "@/components/books/book-grid";
import { cn } from "@/lib/utils";

interface CatalogExplorerProps {
  books: Book[];
  locale: Locale;
}

export function CatalogExplorer({ books, locale }: CatalogExplorerProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initialCategory = searchParams.get("categoria") ?? "all";
  const initialQuery = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<CatalogFilters>({
    ...DEFAULT_FILTERS,
    category: categories.some((category) => category.id === initialCategory)
      ? initialCategory
      : "all",
    query: initialQuery,
  });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(filters.query);

  const visibleBooks = useMemo(
    () => filterBooks(books, locale, { ...filters, query: deferredQuery }),
    [books, filters, deferredQuery, locale],
  );
  const activeFilters = countActiveFilters(filters);

  function updateFilter<K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters((current) => ({
      ...DEFAULT_FILTERS,
      sort: current.sort,
    }));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categoria");
    params.delete("q");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  function applyCategory(value: string) {
    updateFilter("category", value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("categoria");
    else params.set("categoria", value);
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  return (
    <div>
      <div className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-soft backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gold-600"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search" className="sr-only">
              {t("library.searchLabel")}
            </label>
            <Input
              id="catalog-search"
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder={t("library.searchPlaceholder")}
              className="h-12 rounded-full pl-11 pr-10"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => updateFilter("query", "")}
                className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={t("common.clearSearch")}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="sort-select" className="sr-only">
                {t("library.sort")}
              </label>
              <Select
                value={filters.sort}
                onValueChange={(value) => updateFilter("sort", value as CatalogSort)}
              >
                <SelectTrigger
                  id="sort-select"
                  className="h-12 rounded-full lg:w-44"
                  aria-label={t("library.sort")}
                >
                  <SelectValue placeholder={t("library.sort")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{t("library.sortFeatured")}</SelectItem>
                  <SelectItem value="newest">{t("library.sortNewest")}</SelectItem>
                  <SelectItem value="title">{t("library.sortTitle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((current) => !current)}
              className="h-12 rounded-full lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {t("library.openFilters")}
              {activeFilters > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-gold-400 text-[0.6rem] font-bold text-forest-950">
                  {activeFilters}
                </span>
              )}
            </Button>
            <div className="hidden items-center rounded-full border border-border/80 p-1 lg:flex">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label={t("library.gridView")}
                className={cn(
                  "grid size-9 place-items-center rounded-full transition-colors",
                  view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label={t("library.listView")}
                className={cn(
                  "grid size-9 place-items-center rounded-full transition-colors",
                  view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <List className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          id="catalog-filters"
          className={cn(
            "mt-4 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-3",
            !filtersOpen && "hidden lg:grid",
          )}
        >
          <div>
            <label
              htmlFor="category-select"
              className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              {t("library.filterCategory")}
            </label>
            <Select value={filters.category} onValueChange={applyCategory}>
              <SelectTrigger id="category-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("library.allCategories")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {getCategoryName(category.id, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="format-select"
              className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              {t("library.filterFormat")}
            </label>
            <Select
              value={filters.format}
              onValueChange={(value) => updateFilter("format", value as CatalogFilters["format"])}
            >
              <SelectTrigger id="format-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("library.allFormats")}</SelectItem>
                <SelectItem value="epub">EPUB</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="language-select"
              className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              {t("library.filterLanguage")}
            </label>
            <Select
              value={filters.language}
              onValueChange={(value) =>
                updateFilter("language", value as CatalogFilters["language"])
              }
            >
              <SelectTrigger id="language-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("library.allLanguages")}</SelectItem>
                {locales.map((item) => (
                  <SelectItem key={item} value={item}>
                    {localeLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
            {t("library.results", { count: visibleBooks.length })}
            {activeFilters > 0 && (
              <span className="ml-2 text-[0.68rem] text-muted-foreground/70">
                · {t("library.filterCount", { count: activeFilters })}
              </span>
            )}
          </p>
          {(activeFilters > 0 || filters.query) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-3 text-xs">
              <X className="size-3.5" aria-hidden="true" />
              {t("library.clearFilters")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10">
        {visibleBooks.length > 0 ? (
          <BookGrid books={visibleBooks} locale={locale} layout={view} />
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-secondary text-gold-700">
              <Search className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-2xl font-medium">{t("library.emptyTitle")}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("library.emptyBody")}
            </p>
            <Button onClick={clearFilters} variant="outline" className="mt-6">
              {t("library.clearFilters")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => applyCategory(category.id)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Badge
              variant={filters.category === category.id ? "gold" : "outline"}
              className="cursor-pointer px-3.5 py-1.5 normal-case tracking-normal hover:border-gold-300"
            >
              {getCategoryName(category.id, locale)}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
