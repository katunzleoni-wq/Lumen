import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n";
import { createPageMetadata } from "@/lib/metadata";
import { SearchExperience } from "@/components/search-experience";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    ...createPageMetadata({
      locale,
      title: t("searchTitle"),
      description: t("searchDescription"),
      path: `/${locale}/busca`,
    }),
    robots: { index: false, follow: true },
  };
}

function SearchFallback() {
  return (
    <div className="mt-8 space-y-4">
      <Skeleton className="h-24 w-full rounded-[1.75rem]" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export default async function SearchPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return null;
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <section className="container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="flex items-center justify-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
          <Search className="size-3.5" aria-hidden="true" />
          {t("search.eyebrow")}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
          {t("search.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("search.description")}
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-4xl">
        <Suspense fallback={<SearchFallback />}>
          <SearchExperience locale={locale} />
        </Suspense>
      </div>
    </section>
  );
}
