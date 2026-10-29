import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Code2, ExternalLink, FileText, Scale, ShieldCheck, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, locales, type Locale } from "@/i18n";
import { Link } from "@/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "licenses" });
  return createPageMetadata({
    locale,
    title: t("title"),
    description: t("lead"),
    path: `/${locale}/licencas`,
  });
}

const sections = [
  { key: "feb", icon: FileText },
  { key: "public", icon: Scale },
  { key: "authors", icon: Users },
  { key: "code", icon: Code2 },
] as const;

export default async function LicensesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <>
      <section className="border-b border-border/60 bg-papyrus-100/40">
        <div className="container py-14 sm:py-20">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              {t("common.home")}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-foreground">
              {t("licenses.title")}
            </span>
          </nav>

          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
              <span className="h-px w-7 bg-gold-500" aria-hidden="true" />
              {t("licenses.eyebrow")}
            </p>
            <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-6xl">
              {t("licenses.title")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
              {t("licenses.lead")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge variant="gold">FEB · 2026</Badge>
              <Badge variant="outline">MIT</Badge>
              <Badge variant="outline">Public Domain</Badge>
              <span className="text-[0.68rem] text-muted-foreground">{t("licenses.updated")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 sm:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map(({ key, icon: Icon }) => (
            <article
              key={key}
              className="flex h-full flex-col rounded-3xl border border-border/80 bg-card/70 p-6 shadow-soft sm:p-8"
            >
              <span className="grid size-11 place-items-center rounded-full bg-forest-950 text-papyrus-50">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-6 font-serif text-2xl font-medium tracking-[-0.02em]">
                {t(`licenses.${key}Title`)}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t(`licenses.${key}Body`)}
              </p>
              {key === "feb" && (
                <a
                  href="/licenses/feb-2026-leon-denis.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-forest-800 underline-offset-4 hover:underline"
                >
                  {t("licenses.febLink")}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>

        <aside className="mt-8 rounded-3xl border border-gold-200/80 bg-gold-50/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-700" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-2xl font-medium">{t("licenses.correctionsTitle")}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gold-900/75">
                {t("licenses.correctionsBody")}
              </p>
            </div>
          </div>
        </aside>

        <div className="mt-10">
          <Button asChild variant="outline">
            <Link href="/biblioteca">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("licenses.back")}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
