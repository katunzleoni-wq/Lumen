import type { Locale } from "@/i18n";
import type { Book, BookFormat } from "@/content/books";
import { getCategoryName } from "@/content/books";
import { normalizeSearch } from "./utils";

export type CatalogSort = "featured" | "newest" | "title";

export interface CatalogFilters {
  query: string;
  category: string;
  format: "all" | BookFormat;
  language: "all" | Locale;
  sort: CatalogSort;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  category: "all",
  format: "all",
  language: "all",
  sort: "featured",
};

export function countActiveFilters(
  filters: CatalogFilters,
  defaultLanguage: CatalogFilters["language"] = "all",
) {
  return [
    filters.category !== "all",
    filters.format !== "all",
    filters.language !== defaultLanguage,
  ].filter(Boolean).length;
}

export function filterBooks(books: Book[], locale: Locale, filters: CatalogFilters): Book[] {
  const query = normalizeSearch(filters.query);
  const result = books.filter((book) => {
    if (filters.category !== "all" && book.category !== filters.category) return false;
    if (filters.format !== "all" && !book.formats.includes(filters.format)) return false;
    if (filters.language !== "all" && book.language !== filters.language) return false;
    if (!query) return true;
    const haystack = normalizeSearch(
      [
        book.title[locale],
        book.subtitle[locale],
        book.originalTitle,
        book.author,
        book.description[locale],
        getCategoryName(book.category, locale),
        String(book.year),
      ].join(" "),
    );
    return haystack.includes(query);
  });

  if (filters.sort === "title") {
    return result.sort((a, b) => a.title[locale].localeCompare(b.title[locale], locale));
  }
  if (filters.sort === "newest") {
    return result.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }
  return result;
}
