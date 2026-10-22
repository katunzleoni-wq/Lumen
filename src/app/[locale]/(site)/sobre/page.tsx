import type { Metadata } from "next";
import {
  Accessibility,
  ArrowDown,
  ArrowUpRight,
  BookMarked,
  Database,
  HeartHandshake,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, locales, type Locale } from "@/i18n";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { ContactForm } from "@/components/about/contact-form";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    path: `/${locale}/sobre`,
  });
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return null;
  const locale: Locale = params.locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const faq = [
    { question: t("about.faq1Question"), answer: t("about.faq1Answer") },
    { question: t("about.faq2Question"), answer: t("about.faq2Answer") },
    { question: t("about.faq3Question"), answer: t("about.faq3Answer") },
    { question: t("about.faq4Question"), answer: t("about.faq4Answer") },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Lumen",
            url: absoluteUrl(`/${locale}/sobre`),
            description: t("about.lead"),
            knowsLanguage: locales,
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
        ]}
      />

      <section className="relative overflow-hidden border-b border-border/60 bg-hero-glow">
        <div className="container grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-24">
          <div>
            <p className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
              <span className="h-px w-7 bg-gold-500" aria-hidden="true" />
              {t("about.eyebrow")}
            </p>
            <h1 className="mt-5 max-w-3xl text-balance font-serif text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1] tracking-[-0.045em]">
              {t("about.title")}
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("about.lead")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <a href="#contato">
                  {t("about.contactCta")}
                  <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <a
                href="#missao"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-forest-800 underline-offset-4 hover:underline"
              >
                {t("about.missionTitle")}
                <ArrowUpRight className="size-4 text-gold-600" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div
              className="absolute -inset-4 rounded-[2rem] border border-gold-300/30"
              aria-hidden="true"
            />
            <div className="surface-paper relative rounded-[1.75rem] border border-border/80 p-7 shadow-lift sm:p-9">
              <span className="grid size-12 place-items-center rounded-full bg-forest-950 text-papyrus-50">
                <BookMarked className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-8 font-serif text-2xl italic leading-snug text-forest-900">
                “{t("home.quote")}”
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-gold-800">
                {t("home.quoteAuthor")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border/70 pt-5">
                <div>
                  <p className="font-serif text-2xl text-foreground">4</p>
                  <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {t("hero.statsLanguages")}
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-foreground">EPUB · PDF</p>
                  <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {t("hero.statsFormats")}
                  </p>
                </div>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[0.64rem] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-gold-600" aria-hidden="true" />
                {t("hero.trust")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="missao" className="container scroll-mt-28 py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.45fr_1fr] lg:gap-20">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-800">
              01 · {t("about.missionTitle")}
            </p>
            <div className="mt-6 h-px w-16 bg-gold-500" aria-hidden="true" />
          </div>
          <div>
            <h2 className="max-w-2xl text-balance font-serif text-4xl font-medium leading-[1.1] tracking-[-0.03em] sm:text-5xl">
              {t("about.title")}
            </h2>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("about.missionBody")}
            </p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-3">
              {[
                {
                  icon: Scale,
                  title: t("about.preservationTitle"),
                  body: t("about.preservationBody"),
                },
                {
                  icon: Database,
                  title: t("about.technologyTitle"),
                  body: t("about.technologyBody"),
                },
                {
                  icon: HeartHandshake,
                  title: t("about.sampleTitle"),
                  body: t("about.sampleBody"),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-background p-6">
                    <Icon className="size-5 text-gold-600" strokeWidth={1.5} aria-hidden="true" />
                    <h3 className="mt-5 font-serif text-xl leading-snug">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="direitos"
        className="scroll-mt-24 border-y border-border/60 bg-forest-950 text-papyrus-100"
      >
        <div className="container py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-300">
                02 · {t("footer.transparency")}
              </p>
              <h2 className="mt-5 text-balance font-serif text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-5xl">
                {t("about.rightsTitle")}
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-papyrus-200/65">
                {t("about.rightsBody")}
              </p>
              <div className="mt-8">
                <Badge variant="inverse">Domínio público</Badge>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article
                id="privacidade"
                className="scroll-mt-28 rounded-2xl border border-papyrus-50/10 bg-papyrus-50/5 p-6"
              >
                <LockKeyhole
                  className="size-5 text-gold-300"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-serif text-2xl">{t("about.privacyTitle")}</h3>
                <p className="mt-3 text-xs leading-relaxed text-papyrus-200/60">
                  {t("about.privacyBody")}
                </p>
              </article>
              <article
                id="acessibilidade"
                className="scroll-mt-28 rounded-2xl border border-papyrus-50/10 bg-papyrus-50/5 p-6"
              >
                <Accessibility
                  className="size-5 text-gold-300"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="mt-5 font-serif text-2xl">{t("about.accessibilityTitle")}</h3>
                <p className="mt-3 text-xs leading-relaxed text-papyrus-200/60">
                  {t("about.accessibilityBody")}
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            eyebrow={t("about.sampleTitle")}
            title={t("about.faqTitle")}
            description={t("about.sampleBody")}
          />
          <Accordion type="single" collapsible className="border-t border-border/80">
            {faq.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section id="contato" className="container scroll-mt-24 pb-20 sm:pb-28">
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-lift">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="relative overflow-hidden bg-forest-950 p-8 text-papyrus-100 sm:p-10 lg:p-12">
              <div
                className="pointer-events-none absolute -bottom-24 -right-20 size-72 rounded-full border border-gold-300/20"
                aria-hidden="true"
              />
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold-300">
                03 · {t("footer.contact")}
              </p>
              <h2 className="mt-5 text-balance font-serif text-4xl font-medium leading-[1.1] tracking-[-0.03em]">
                {t("about.contactTitle")}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-papyrus-200/65">
                {t("about.contactBody")}
              </p>
              <div className="mt-8 space-y-3 text-xs text-papyrus-200/55">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-gold-300" aria-hidden="true" />
                  {t("footer.privacy")}
                </p>
                <p className="flex items-center gap-2">
                  <Accessibility className="size-3.5 text-gold-300" aria-hidden="true" />
                  {t("footer.accessibility")}
                </p>
              </div>
            </div>
            <div className="bg-background p-7 sm:p-10 lg:p-12">
              <ContactForm locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
