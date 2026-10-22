import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n";
import { createPageMetadata } from "@/lib/metadata";
import { FavoritesView } from "@/components/favorites-view";

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
      title: t("favoritesTitle"),
      description: t("favoritesDescription"),
      path: `/${locale}/favoritos`,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function FavoritesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return null;
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <section className="container py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
          <span className="h-px w-7 bg-gold-500" aria-hidden="true" />
          {t("favorites.eyebrow")}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <h1 className="font-serif text-4xl font-medium tracking-[-0.035em] sm:text-5xl">
            {t("favorites.title")}
          </h1>
          <span className="grid size-11 place-items-center rounded-full border border-gold-200 bg-gold-50 text-gold-700">
            <Bookmark className="size-5" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("favorites.description")}
        </p>
      </div>
      <FavoritesView locale={locale} />
    </section>
  );
}
