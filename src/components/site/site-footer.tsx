import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Logo } from "./logo";

export function SiteFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-papyrus-50/10 bg-forest-950 text-papyrus-100">
      <div className="container py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label={t("meta.siteName")}
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-4 focus-visible:ring-offset-forest-950"
            >
              <Logo inverted />
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-papyrus-200/70">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-papyrus-50/10 px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-papyrus-200/60">
              <span className="size-1.5 rounded-full bg-gold-400" aria-hidden="true" />
              {t("hero.statsLanguages")} · {t("hero.statsFormats")}
            </div>
          </div>

          <div>
            <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-papyrus-200/45">
              {t("footer.explore")}
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/biblioteca"
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("nav.library")}
                </Link>
              </li>
              <li>
                <Link
                  href="/busca"
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("nav.search")}
                </Link>
              </li>
              <li>
                <Link
                  href="/favoritos"
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("nav.favorites")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-papyrus-200/45">
              {t("footer.about")}
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/sobre"
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <a
                  href={`/${locale}/sobre#acessibilidade`}
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("footer.accessibility")}
                </a>
              </li>
              <li>
                <a
                  href={`/${locale}/sobre#direitos`}
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("about.rightsTitle")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-papyrus-200/45">
              {t("footer.transparency")}
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`/${locale}/sobre#contato`}
                  className="group inline-flex items-center gap-1 text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("footer.contact")}
                  <ArrowUpRight
                    className="size-3.5 text-gold-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
              </li>
              <li>
                <Link
                  href="/licencas"
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("footer.licenses")}
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre"
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("about.sampleTitle")}
                </Link>
              </li>
              <li>
                <a
                  href={`/${locale}/sobre#privacidade`}
                  className="text-papyrus-100/80 transition-colors hover:text-papyrus-50"
                >
                  {t("footer.privacy")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-papyrus-50/10 pt-7 text-xs text-papyrus-200/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights", { year })}</p>
          <p>{t("footer.builtWith")}</p>
        </div>
      </div>
    </footer>
  );
}
