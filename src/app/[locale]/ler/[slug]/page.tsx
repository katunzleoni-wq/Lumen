import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  books,
  getBookBySlug,
  getBookEdition,
  getEditionFormats,
  type BookFormat,
} from "@/content/books";
import { isLocale, locales, type Locale } from "@/i18n";
import { createPageMetadata } from "@/lib/metadata";
import { ReaderExperience } from "@/components/reader/reader-experience";

export function generateStaticParams() {
  return locales.flatMap((locale) => books.map((book) => ({ locale, slug: book.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const book = getBookBySlug(params.slug);
  if (!book) return { title: "404" };
  const locale: Locale = params.locale;
  const t = await getTranslations({ locale });
  return {
    ...createPageMetadata({
      locale,
      title: `${t("book.readSample")} — ${book.title[locale]}`,
      description: book.description[locale],
      path: `/${locale}/ler/${book.slug}`,
      pathForLocale: (item) => `/${item}/ler/${book.slug}`,
    }),
    robots: { index: false, follow: true },
  };
}

function resolveFormat(value: string | undefined, bookFormats: BookFormat[]): BookFormat {
  if (value === "pdf" || value === "epub") {
    return bookFormats.includes(value) ? value : (bookFormats[0] ?? "epub");
  }
  return bookFormats[0] ?? "epub";
}

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: { locale: string; slug: string };
  searchParams: { formato?: string; lang?: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const book = getBookBySlug(params.slug);
  if (!book) notFound();

  const edition = getBookEdition(book, searchParams.lang);
  const formats = edition ? getEditionFormats(edition) : book.formats;
  const initialFormat = resolveFormat(searchParams.formato, formats);

  return (
    <ReaderExperience
      book={book}
      edition={edition}
      initialFormat={initialFormat}
      readingId={edition ? `${book.id}:${edition.id}` : book.id}
    />
  );
}
