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
    expect(categoryResult).toHaveLength(2);
    expect(categoryResult.map((book) => book.id)).toEqual(
      expect.arrayContaining([
        "o-livro-dos-mediuns",
        "instrucao-pratica-sobre-as-manifestacoes-espiritas",
      ]),
    );

    const formatResult = filterBooks(books, "pt", { ...baseFilters, format: "pdf" });
    expect(formatResult).toHaveLength(3);
    expect(formatResult.map((book) => book.id)).toEqual(
      expect.arrayContaining([
        "o-livro-dos-espiritos",
        "o-livro-dos-mediuns",
        "instrucao-pratica-sobre-as-manifestacoes-espiritas",
      ]),
    );

    const languageResult = filterBooks(books, "pt", { ...baseFilters, language: "en" });
    expect(languageResult.length).toBeGreaterThan(0);
    expect(languageResult.every((book) => book.language === "en")).toBe(true);
  });

  it("sorts by title using the active locale", () => {
    const result = filterBooks(books, "pt", { ...baseFilters, sort: "title" });
    const titles = result.map((book) => book.title.pt);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "pt")));
  });

  it("sorts newest additions first", () => {
    const result = filterBooks(books, "pt", { ...baseFilters, sort: "newest" });
    expect(result).toHaveLength(books.length);
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
