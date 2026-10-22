import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Languages,
  LibraryBig,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  books,
  getBookBySlug,
  getBookCover,
  getBookToc,
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
  const toc = getBookToc(book.slug);
  const related = getRelatedBooks(book, 3);
  const title = book.title[locale];
  const coverUrl = absoluteUrl(getBookCover(book.slug));
  const bookUrl = absoluteUrl(`/${locale}/livro/${book.slug}`);
  const sourceHost = new URL(book.source.url).hostname.replace(/^www\./, "");
  const visibleToc = toc.slice(0, 16);
  const remainingChapters = Math.max(toc.length - visibleToc.length, 0);

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
          description: book.description[locale],
          image: coverUrl,
          url: bookUrl,
          publisher: { "@type": "Organization", name: "Lumen" },
          bookFormat: "https://schema.org/EBook",
          isAccessibleForFree: true,
          license: book.source.licenseUrl,
          potentialAction: {
            "@type": "ReadAction",
            target: absoluteUrl(`/${locale}/ler/${book.slug}`),
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
                  <div
                    className={`mt-4 grid gap-2 ${book.formats.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                  >
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

                <div className="mt-4 flex items-start gap-2 text-[0.66rem] leading-relaxed text-muted-foreground">
                  <ScrollText
                    className="mt-0.5 size-3.5 shrink-0 text-gold-600"
                    aria-hidden="true"
                  />
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
                <Badge variant="secondary">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  {t("book.publicDomain")}
                </Badge>
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

              {book.alternateEditions?.map((edition) => (
                <section
                  key={edition.id}
                  className="mt-8 rounded-2xl border border-forest-200/70 bg-forest-50/50 p-5 sm:p-6"
                  aria-labelledby={`edition-${edition.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-forest-700">
                        <Languages className="size-3.5" aria-hidden="true" />
                        {t("book.otherLanguages")}
                      </p>
                      <h2
                        id={`edition-${edition.id}`}
                        className="mt-2 font-serif text-xl font-medium"
                      >
                        {edition.label[locale]}
                      </h2>
                      {edition.translator && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {edition.translator} · {edition.license}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      <ShieldCheck className="size-3" aria-hidden="true" />
                      {t("book.licensedByFeb")}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {edition.pdf && (
                      <Button asChild size="sm">
                        <Link href={`/ler/${book.slug}?lang=${edition.language}&formato=pdf`}>
                          <BookOpen className="size-4" aria-hidden="true" />
                          {t("book.readThisEdition")}
                        </Link>
                      </Button>
                    )}
                    {edition.pdf && (
                      <Button asChild variant="outline" size="sm">
                        <a href={edition.pdf} download>
                          <Download className="size-3.5" aria-hidden="true" />
                          PDF
                        </a>
                      </Button>
                    )}
                    {edition.epub && (
                      <Button asChild variant="outline" size="sm">
                        <a href={edition.epub} download>
                          <Download className="size-3.5" aria-hidden="true" />
                          EPUB
                        </a>
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 text-[0.66rem] leading-relaxed text-muted-foreground">
                    {t("book.sampleNote")}
                  </p>
                </section>
              ))}

              {toc.length > 0 && (
                <section className="mt-12" aria-labelledby="toc-heading">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2
                        id="toc-heading"
                        className="font-serif text-2xl font-medium tracking-[-0.02em]"
                      >
                        {t("book.contents")}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">{t("book.tocNote")}</p>
                    </div>
                    <Badge variant="outline">
                      {t("book.chaptersCount", { count: toc.length })}
                    </Badge>
                  </div>
                  <ol className="mt-4 grid gap-x-8 divide-y divide-border/60 border-y border-border/60 sm:grid-cols-2 sm:divide-y-0">
                    {visibleToc.map((chapter, index) => (
                      <li
                        key={`${chapter}-${index}`}
                        className="flex items-start gap-3 border-b border-border/50 py-3 last:border-b-0"
                      >
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border text-[0.6rem] font-semibold text-gold-700">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="font-serif text-[0.98rem] leading-snug text-foreground">
                          {chapter}
                        </p>
                      </li>
                    ))}
                  </ol>
                  {remainingChapters > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      + {t("book.chaptersCount", { count: remainingChapters })} ·{" "}
                      <Link
                        href={`/ler/${book.slug}`}
                        className="font-semibold text-forest-700 underline-offset-4 hover:underline"
                      >
                        {t("book.openReader")}
                      </Link>
                    </p>
                  )}
                </section>
              )}

              <section
                className="mt-10 rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6"
                aria-labelledby="source-heading"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="source-heading" className="font-serif text-xl font-medium">
                    {t("book.sourceTitle")}
                  </h2>
                  <a
                    href={book.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 underline-offset-4 hover:underline"
                  >
                    {book.source.provider}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
                <dl className="mt-4 grid gap-x-8 gap-y-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{t("book.sourceProvider")}</dt>
                    <dd className="mt-1 font-medium">{sourceHost}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("book.sourcePublisher")}</dt>
                    <dd className="mt-1 font-medium">{book.source.publisher}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("book.sourceEdition")}</dt>
                    <dd className="mt-1 font-medium">{book.source.edition}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("book.sourceLicense")}</dt>
                    <dd className="mt-1 font-medium">
                      <a
                        href={book.source.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4 hover:text-forest-700"
                      >
                        {book.source.license}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("book.sourceCaptured")}</dt>
                    <dd className="mt-1 font-medium">{book.source.capturedAt}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <p className="max-w-xl text-[0.66rem] leading-relaxed text-muted-foreground">
                    {book.source.editionNote}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs">
                    <a href={book.source.url} target="_blank" rel="noopener noreferrer">
                      {t("book.viewSource")}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </section>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold-200/70 bg-gold-50/60 p-5">
                <FileText className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-gold-900/80">{t("book.sampleNote")}</p>
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
