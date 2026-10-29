import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Compass,
  HeartHandshake,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Telescope,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n";
import { Link } from "@/navigation";
import { books, categories, getCategoryName, getFeaturedBooks } from "@/content/books";
import { absoluteUrl } from "@/lib/site";
import { BookCover } from "@/components/books/book-cover";
import { BookGrid } from "@/components/books/book-grid";
import { SectionHeading } from "@/components/site/section-heading";
import { NewsletterForm } from "@/components/newsletter-form";
import { JsonLd } from "@/components/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categoryIcons = {
  fundamentos: Compass,
  evangelho: HeartHandshake,
  mediunidade: Sparkles,
  pesquisa: Telescope,
  espiritualismo: Sun,
} as const;

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return null;
  const locale: Locale = params.locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const allFeatured = getFeaturedBooks();
  const localeBooks = books.filter((book) => book.language === locale);
  const localizedFeatured = allFeatured.filter((book) => book.language === locale);
  const featured = localizedFeatured.length
    ? [
        ...localizedFeatured,
        ...localeBooks.filter((book) => !localizedFeatured.includes(book)),
      ].slice(0, 4)
    : localeBooks.length
      ? localeBooks.slice(0, 4)
      : allFeatured;
  const primary = featured[0]!;
  const secondary = featured[1] ?? primary;
  const tertiary = featured[2] ?? primary;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Lumen",
          alternateName: t("meta.homeTitle"),
          url: absoluteUrl(`/${locale}`),
          inLanguage: locale,
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl(`/${locale}/busca`)}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-28 top-16 size-[30rem] rounded-full border border-gold-300/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 top-28 size-[22rem] rounded-full border border-forest-500/10"
          aria-hidden="true"
        />

        <div className="container relative grid gap-14 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-8 lg:pb-24 lg:pt-24">
          <div className="relative z-10 max-w-2xl">
            <p className="flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
              <span className="h-px w-8 bg-gold-500" aria-hidden="true" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-6 text-[clamp(2.9rem,7.2vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.045em] text-foreground">
              {t("hero.titleLead")}{" "}
              <span className="mt-1 block font-serif italic text-forest-700">
                {t("hero.titleAccent")}
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-[0.98rem] leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
              {t("hero.description")}
            </p>

            <form
              action={`/${locale}/busca`}
              method="get"
              role="search"
              className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-border/80 bg-card/90 p-1.5 pl-4 shadow-soft backdrop-blur-sm focus-within:border-forest-300 focus-within:ring-2 focus-within:ring-ring/20"
            >
              <Search className="size-4 shrink-0 text-gold-600" aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">
                {t("common.searchPlaceholder")}
              </label>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder={t("common.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
              />
              <Button type="submit" size="sm" className="shrink-0 px-5">
                {t("common.search")}
              </Button>
            </form>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild size="lg">
                <Link href="/biblioteca">
                  {t("hero.primaryCta")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Link
                href="/sobre"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-forest-800 underline-offset-4 hover:underline"
              >
                {t("hero.secondaryCta")}
                <ArrowUpRight
                  className="size-4 text-gold-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-border/70 pt-6 text-xs">
              <div className="flex items-baseline gap-2">
                <dt className="order-2 text-muted-foreground">{t("nav.library")}</dt>
                <dd className="order-1 font-serif text-xl text-foreground">
                  {t("hero.statsBooks", { count: books.length })}
                </dd>
              </div>
              <div className="h-6 w-px bg-border" aria-hidden="true" />
              <div>
                <dd className="font-semibold text-foreground">{t("hero.statsLanguages")}</dd>
              </div>
              <div className="h-6 w-px bg-border" aria-hidden="true" />
              <div>
                <dd className="font-semibold text-foreground">{t("hero.statsFormats")}</dd>
              </div>
            </dl>
            <p className="mt-5 flex items-center gap-2 text-[0.68rem] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-forest-500" aria-hidden="true" />
              {t("hero.trust")}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[31rem] lg:max-w-none">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 size-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-200/25 blur-3xl sm:size-[31rem]"
              aria-hidden="true"
            />
            <div className="cover-stack-perspective relative mx-auto aspect-[0.96] w-full max-w-[29rem]">
              <div className="absolute left-[7%] top-[13%] w-[46%] -rotate-6 opacity-90">
                <Link href={`/livro/${secondary.slug}`} className="block">
                  <BookCover
                    slug={secondary.slug}
                    title={secondary.title[locale]}
                    alt={t("a11y.bookCover", { title: secondary.title[locale] })}
                    sizes="(max-width: 1024px) 40vw, 220px"
                    className="shadow-book"
                  />
                </Link>
              </div>
              <div className="absolute right-[3%] top-[25%] w-[43%] rotate-[7deg] opacity-95">
                <Link href={`/livro/${tertiary.slug}`} className="block">
                  <BookCover
                    slug={tertiary.slug}
                    title={tertiary.title[locale]}
                    alt={t("a11y.bookCover", { title: tertiary.title[locale] })}
                    sizes="(max-width: 1024px) 38vw, 200px"
                    className="shadow-book"
                  />
                </Link>
              </div>
              <div className="absolute left-1/2 top-[4%] z-10 w-[58%] -translate-x-1/2 animate-soft-float">
                <Link href={`/livro/${primary.slug}`} className="block">
                  <BookCover
                    slug={primary.slug}
                    title={primary.title[locale]}
                    alt={t("a11y.bookCover", { title: primary.title[locale] })}
                    priority
                    sizes="(max-width: 1024px) 55vw, 320px"
                    className="shadow-book"
                  />
                </Link>
              </div>

              <div className="bg-card/92 absolute bottom-[4%] left-1/2 z-20 w-[86%] -translate-x-1/2 rounded-2xl border border-white/50 p-4 shadow-lift backdrop-blur-md sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
                      {t("home.featuredEyebrow")} · 2026
                    </p>
                    <p className="mt-1.5 font-serif text-lg leading-snug text-foreground">
                      {primary.title[locale]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {primary.author} · {primary.year}
                    </p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-800 text-papyrus-50">
                    <Bookmark className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-[0.65rem] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-gold-500" aria-hidden="true" />
                  {t("book.savedLocal")}
                  <span className="ml-auto flex gap-1.5">
                    {primary.formats.map((format) => (
                      <Badge key={format} variant="outline" className="px-2 py-0.5 text-[0.55rem]">
                        {format.toUpperCase()}
                      </Badge>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20 sm:py-24">
        <SectionHeading
          eyebrow={t("home.featuredEyebrow")}
          title={t("home.featuredTitle")}
          description={t("home.featuredDescription")}
          action={
            <Button asChild variant="outline">
              <Link href="/biblioteca">
                {t("common.viewAll")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <BookGrid books={featured} locale={locale} className="mt-12" priorityCount={2} />
        <p className="mt-10 flex items-start gap-2 border-t border-border/60 pt-5 text-[0.68rem] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold-600" aria-hidden="true" />
          {t("home.sampleNotice")}
        </p>
      </section>

      <section className="border-y border-border/60 bg-papyrus-100/55">
        <div className="container py-20 sm:py-24">
          <SectionHeading
            eyebrow={t("home.categoriesEyebrow")}
            title={t("home.categoriesTitle")}
            description={t("home.categoriesDescription")}
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border/80 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? BookOpen;
              const count = books.filter((book) => book.category === category.id).length;
              return (
                <Link
                  key={category.id}
                  href={`/biblioteca?categoria=${category.id}`}
                  className="group relative flex min-h-48 flex-col justify-between bg-background/95 p-6 transition-colors hover:bg-card sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-full border border-border/80 bg-card text-forest-700 transition-colors group-hover:border-gold-300 group-hover:text-gold-700">
                      <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="font-serif text-xs italic text-muted-foreground/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl font-medium text-foreground">
                        {getCategoryName(category.id, locale)}
                      </h3>
                      <span className="text-[0.64rem] text-muted-foreground">({count})</span>
                    </div>
                    <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                      {category.description[locale]}
                    </p>
                    <ArrowUpRight
                      className="absolute bottom-6 right-6 size-4 text-gold-600 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest-950 text-papyrus-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(210,166,85,0.18),transparent_40%),radial-gradient(circle_at_85%_70%,rgba(96,149,124,0.25),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="container relative grid gap-10 py-20 sm:py-24 lg:grid-cols-[0.35fr_1fr] lg:items-start">
          <div>
            <p className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-300">
              <span className="h-px w-8 bg-gold-400/60" aria-hidden="true" />
              {t("home.quoteEyebrow")}
            </p>
            <p className="mt-6 max-w-[15rem] text-xs leading-relaxed text-papyrus-200/55">
              {t("home.quoteNote")}
            </p>
          </div>
          <figure>
            <span className="font-serif text-6xl leading-none text-gold-400/60" aria-hidden="true">
              “
            </span>
            <blockquote className="-mt-5 font-serif text-[clamp(1.8rem,4vw,3.3rem)] font-medium leading-[1.16] tracking-[-0.02em] text-papyrus-50">
              {t("home.quote")}
            </blockquote>
            <figcaption className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-gold-200">{t("home.quoteAuthor")}</span>
              <span className="size-1 rounded-full bg-papyrus-200/30" aria-hidden="true" />
              <cite className="not-italic text-papyrus-200/55">{t("home.quoteSource")}</cite>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="container py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            eyebrow={t("home.aboutEyebrow")}
            title={t("home.aboutTitle")}
            description={t("home.aboutBody")}
            action={
              <Button asChild variant="outline">
                <Link href="/sobre">
                  {t("home.aboutCta")}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: t("home.readingTitle"),
                body: t("home.readingBody"),
              },
              {
                icon: ShieldCheck,
                title: t("home.offlineTitle"),
                body: t("home.offlineBody"),
              },
              {
                icon: Accessibility,
                title: t("home.accessibilityTitle"),
                body: t("home.accessibilityBody"),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-background p-6">
                  <Icon className="size-5 text-gold-600" strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-5 font-serif text-lg leading-snug">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container pb-20 sm:pb-24">
        <div className="surface-paper relative overflow-hidden rounded-[2rem] border border-border/80 p-7 shadow-soft sm:p-10 lg:p-12">
          <div
            className="pointer-events-none absolute -right-14 -top-14 size-56 rounded-full border border-gold-300/30"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
                {t("home.newsletterEyebrow")}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
                {t("home.newsletterTitle")}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t("home.newsletterDescription")}
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
