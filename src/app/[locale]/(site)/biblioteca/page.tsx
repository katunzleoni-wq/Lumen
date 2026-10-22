import { Suspense } from "react";
import { BookOpen, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getBooks } from "@/content/books";
import { isLocale, type Locale } from "@/i18n";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "meta" });
  return createPageMetadata({
    locale,
    title: t("libraryTitle"),
    description: t("libraryDescription"),
    path: `/${locale}/biblioteca`,
  });
}

function CatalogSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function LibraryPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return null;
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const books = getBooks();

  return (
    <>
      <section className="border-b border-border/60 bg-papyrus-100/40">
        <div className="container py-14 sm:py-16">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <a href={`/${locale}`} className="hover:text-foreground">
              {t("common.home")}
            </a>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-foreground">
              {t("nav.library")}
            </span>
          </nav>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
                <span className="h-px w-7 bg-gold-500" aria-hidden="true" />
                {t("library.eyebrow")}
              </p>
              <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-[1.06] tracking-[-0.035em] sm:text-5xl">
                {t("library.title")}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("library.description")}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card/70 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-forest-900 text-papyrus-50">
                <BookOpen className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-serif text-2xl leading-none">{books.length}</p>
                <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("hero.statsBooks", { count: books.length })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogExplorer books={books} locale={locale} />
        </Suspense>
        <p className="mt-12 flex items-start gap-2 border-t border-border/60 pt-5 text-[0.68rem] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold-600" aria-hidden="true" />
          {t("home.sampleNotice")}
        </p>
      </section>
    </>
  );
}
