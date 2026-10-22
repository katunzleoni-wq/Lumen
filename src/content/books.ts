import booksJson from "../../content/books.json";
import tocJson from "../../content/toc.json";
import type { Locale } from "@/i18n";

export type BookFormat = "epub" | "pdf";

export type LocalizedText = Record<Locale, string>;

export type RightsStatus = "public-domain" | "copyrighted";
export type Availability = "full" | "catalog-only";

export interface BookSource {
  provider: string;
  publisher: string;
  url: string;
  license: string;
  licenseUrl: string;
  edition: string;
  editionNote: string;
  capturedAt: string;
}

export interface Book {
  id: string;
  slug: string;
  author: string;
  originalTitle: string;
  year: number;
  language: Locale;
  category: string;
  readingMinutes: number;
  formats: BookFormat[];
  featured: boolean;
  addedAt: string;
  rights: RightsStatus;
  availability: Availability;
  palette: [string, string, string];
  motif: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  source: BookSource;
}

export interface Category {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
}

export const books = booksJson.books as Book[];
export const categories = booksJson.categories as Category[];

const toc = tocJson as Record<string, string[]>;

export function getBooks(): Book[] {
  return books;
}

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((book) => book.slug === slug);
}

export function getFeaturedBooks(): Book[] {
  return books.filter((book) => book.featured);
}

export function getRelatedBooks(book: Book, limit = 3): Book[] {
  const sameCategory = books.filter(
    (candidate) => candidate.id !== book.id && candidate.category === book.category,
  );
  const fallback = books.filter(
    (candidate) => candidate.id !== book.id && candidate.category !== book.category,
  );
  return [...sameCategory, ...fallback].slice(0, limit);
}

export function getCategory(categoryId: string): Category | undefined {
  return categories.find((category) => category.id === categoryId);
}

export function getCategoryName(categoryId: string, locale: Locale): string {
  const category = getCategory(categoryId);
  if (!category) return categoryId;
  return category.name[locale] ?? category.name.pt;
}

export function getBookToc(slug: string): string[] {
  return toc[slug] ?? [];
}

export function getBookAsset(slug: string, format: BookFormat): string {
  return `/books/${slug}.${format}`;
}

export function getBookCover(slug: string): string {
  return `/covers/${slug}.svg`;
}

export function getBookSearchText(book: Book, locale: Locale): string {
  return [
    book.title[locale],
    book.subtitle[locale],
    book.author,
    book.originalTitle,
    getCategoryName(book.category, locale),
    book.description[locale],
    book.source.provider,
    book.source.publisher,
    ...getBookToc(book.slug),
  ]
    .join(" ")
    .toLocaleLowerCase();
}
