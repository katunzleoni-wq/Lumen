import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Languages,
  LibraryBig,
  ScrollText,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  books,
  getBookBySlug,
  getBookCover,
  getBookSample,
  getCategoryName,
  getRelatedBooks,
} from "@/content/books";
import { isLocale, locales, type Locale } from "@/i18n";
import { Link } from "@/navigation";
import { absoluteUrl } from "@/lib/site";
import { createPageMetadata } from "@/lib/metadata";
import { BookCover } from "@/components/books/book-cover";
import { BookGrid } from "@/components/books/book-grid";
import { BookReadingActions } from "@/components/books/book-reading-actions";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  return createPageMetadata({
    locale,
    title: book.title[locale],
    description: book.description[locale],
    path: `/${locale}/livro/${book.slug}`,
    pathForLocale: (item) => `/${item}/livro/${book.slug}`,
    type: "article",
  });
}

export default async function BookPage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const book = getBookBySlug(params.slug);
  if (!book) notFound();

  const t = await getTranslations({ locale });
  const categoryName = getCategoryName(book.category, locale);
  const sample = getBookSample(book.slug);
  const related = getRelatedBooks(book, 3);
  const title = book.title[locale];
  const coverUrl = absoluteUrl(getBookCover(book.slug));
  const bookUrl = absoluteUrl(`/${locale}/livro/${book.slug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: title,
          alternateName: book.originalTitle,
          author: { "@type": "Person", name: book.author },
          inLanguage: book.language,
          datePublished: String(book.year),
          numberOfPages: book.pages,
          description: book.description[locale],
          image: coverUrl,
          url: bookUrl,
          publisher: { "@type": "Organization", name: "Lumen" },
          bookFormat: "https://schema.org/EBook",
          isAccessibleForFree: true,
          potentialAction: {
            "@type": "ReadAction",
            target: `${absoluteUrl(`/${locale}/ler/${book.slug}`)}`,
          },
        }}
      />

      <section className="border-b border-border/60 bg-papyrus-100/35">
        <div className="container py-10 sm:py-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              {t("common.home")}
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <Link href="/biblioteca" className="transition-colors hover:text-foreground">
              {t("book.breadcrumb")}
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <Link
              href={`/biblioteca?categoria=${book.category}`}
              className="transition-colors hover:text-foreground"
            >
              {categoryName}
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="max-w-[14rem] truncate text-foreground" aria-current="page">
              {title}
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[19rem_1fr] lg:gap-16 xl:grid-cols-[21rem_1fr]">
            <div className="mx-auto w-full max-w-[19rem] lg:mx-0 lg:max-w-none">
              <div className="lg:sticky lg:top-28">
                <div className="cover-stack-perspective">
                  <BookCover
                    slug={book.slug}
                    title={title}
                    alt={t("a11y.bookCover", { title })}
                    priority
                    sizes="(max-width: 1024px) 70vw, 336px"
                    className="book-3d shadow-lift"
                  />
                </div>

                <div className="mt-7 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-soft">
                  <BookReadingActions bookId={book.id} slug={book.slug} title={title} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {book.formats.map((format) => (
                      <Button key={format} asChild variant="outline" size="sm" className="w-full">
                        <a href={`/books/${book.slug}.${format}`} download>
                          <Download className="size-3.5" aria-hidden="true" />
                          {format.toUpperCase()}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-[0.66rem] text-muted-foreground">
                  <ScrollText className="size-3.5 text-gold-600" aria-hidden="true" />
                  {t("book.sampleNote")}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold">{categoryName}</Badge>
                {book.formats.map((format) => (
                  <Badge key={format} variant="outline">
                    {format.toUpperCase()}
                  </Badge>
                ))}
                <Badge variant="muted">{t(`languages.${book.language}`)}</Badge>
              </div>

              <h1 className="mt-5 text-balance font-serif text-[clamp(2.5rem,5vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.04em]">
                {title}
              </h1>
              <p className="mt-4 text-lg font-medium text-forest-700">{book.subtitle[locale]}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("book.eyebrow")} · {book.year} · {book.author}
              </p>

              <div className="mt-8 grid gap-8 border-y border-border/70 py-8 md:grid-cols-[1fr_13rem] md:gap-12">
                <div>
                  <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
                    {t("book.about")}
                  </h2>
                  <p className="mt-3 text-pretty font-serif text-lg leading-relaxed text-foreground/85">
                    {book.description[locale]}
                  </p>
                </div>
                <dl className="space-y-3 text-xs">
                  <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">{t("book.author")}</dt>
                    <dd className="text-right font-medium">{book.author}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">{t("book.originalTitle")}</dt>
                    <dd className="text-right font-medium">{book.originalTitle}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">{t("book.pages")}</dt>
                    <dd className="text-right font-medium">{book.pages}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{t("book.readingTime")}</dt>
                    <dd className="text-right font-medium">
                      {t("common.minutes", { minutes: book.readingMinutes })}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
                  <CalendarDays className="size-4 text-gold-600" aria-hidden="true" />
                  <p className="mt-3 text-[0.61rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {t("book.year")}
                  </p>
                  <p className="mt-1 font-serif text-xl">{book.year}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
                  <Languages className="size-4 text-gold-600" aria-hidden="true" />
                  <p className="mt-3 text-[0.61rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {t("book.language")}
                  </p>
                  <p className="mt-1 font-serif text-xl">{t(`languages.${book.language}`)}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
                  <Clock3 className="size-4 text-gold-600" aria-hidden="true" />
                  <p className="mt-3 text-[0.61rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {t("book.readingTime")}
                  </p>
                  <p className="mt-1 font-serif text-xl">
                    {Math.round(book.readingMinutes / 60)} h
                  </p>
                </div>
              </div>

              {sample && (
                <section className="mt-12" aria-labelledby="sample-heading">
                  <div className="flex items-center justify-between gap-4">
                    <h2
                      id="sample-heading"
                      className="font-serif text-2xl font-medium tracking-[-0.02em]"
                    >
                      {t("book.contents")}
                    </h2>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {sample.label}
                    </span>
                  </div>
                  <ol className="mt-4 divide-y divide-border/60 border-y border-border/60">
                    {sample.chapters.map((chapter, index) => (
                      <li key={chapter.title} className="group flex items-start gap-4 py-4">
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-border text-[0.66rem] font-semibold text-gold-700">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-serif text-lg leading-snug text-foreground">
                            {chapter.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {chapter.paragraphs[0]}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className="mt-10 rounded-2xl border border-gold-200/70 bg-gold-50/60 p-5">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-gold-900/80">{t("book.sampleNote")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <SectionHeading
          eyebrow={t("home.featuredEyebrow")}
          title={t("book.related")}
          description={t("book.relatedDescription")}
          action={
            <Button asChild variant="outline">
              <Link href="/biblioteca">
                <LibraryBig className="size-4" aria-hidden="true" />
                {t("book.backToLibrary")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <BookGrid books={related} locale={locale} className="mt-10 lg:grid-cols-3" />
        <Separator className="mt-16" />
        <Link
          href="/biblioteca"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("book.backToLibrary")}
        </Link>
      </section>
    </>
  );
}
