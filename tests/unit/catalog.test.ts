import { describe, expect, it } from "vitest";
import { books } from "@/content/books";
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  filterBooks,
  type CatalogFilters,
} from "@/lib/catalog";

const baseFilters: CatalogFilters = { ...DEFAULT_FILTERS };

describe("filterBooks", () => {
  it("returns the full catalogue with default filters", () => {
    expect(filterBooks(books, "pt", baseFilters)).toHaveLength(books.length);
  });

  it("matches titles and descriptions without requiring accents", () => {
    const result = filterBooks(books, "pt", { ...baseFilters, query: "espiritos" });
    expect(result.map((book) => book.id)).toContain("o-livro-dos-espiritos");
  });

  it("filters by category, format and text language", () => {
    const categoryResult = filterBooks(books, "pt", {
      ...baseFilters,
      category: "mediunidade",
    });
    expect(categoryResult).toHaveLength(1);
    expect(categoryResult[0]?.id).toBe("o-livro-dos-mediuns");

    const formatResult = filterBooks(books, "pt", { ...baseFilters, format: "pdf" });
    expect(formatResult.every((book) => book.formats.includes("pdf"))).toBe(true);

    const languageResult = filterBooks(books, "pt", { ...baseFilters, language: "en" });
    expect(languageResult).toHaveLength(0);
  });

  it("sorts by title using the active locale", () => {
    const result = filterBooks(books, "pt", { ...baseFilters, sort: "title" });
    const titles = result.map((book) => book.title.pt);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "pt")));
  });

  it("sorts newest additions first", () => {
    const result = filterBooks(books, "pt", { ...baseFilters, sort: "newest" });
    expect(result[0]?.id).toBe("revista-espirita");
    const first = result[0];
    const second = result[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (first && second) expect(first.addedAt >= second.addedAt).toBe(true);
  });
});

describe("countActiveFilters", () => {
  it("ignores query and sort", () => {
    expect(
      countActiveFilters({
        query: "espírito",
        category: "fundamentos",
        format: "epub",
        language: "pt",
        sort: "newest",
      }),
    ).toBe(3);
  });
});
