import type { Metadata } from "next";
import { localeHtmlLang, locales, type Locale } from "@/i18n";
import { absoluteUrl, getSiteUrl, SITE_NAME } from "./site";

export const openGraphLocales: Record<Locale, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
};

interface PageMetadataInput {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  pathForLocale?: (locale: Locale) => string;
  type?: "website" | "article";
}

export function createPageMetadata({
  locale,
  title,
  description,
  path,
  pathForLocale,
  type = "website",
}: PageMetadataInput): Metadata {
  const languages = Object.fromEntries(
    locales.map((item) => [
      localeHtmlLang[item],
      absoluteUrl(pathForLocale ? pathForLocale(item) : path),
    ]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages,
    },
    openGraph: {
      type,
      title: `${title} · ${SITE_NAME}`,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((item) => item !== locale)
        .map((item) => openGraphLocales[item]),
      images: [
        {
          url: absoluteUrl("/og.jpg"),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Biblioteca Digital Espírita Internacional`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [absoluteUrl("/og.jpg")],
    },
  };
}

export const baseMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Lumen — Biblioteca Digital Espírita Internacional",
    template: "%s · Lumen",
  },
  applicationName: SITE_NAME,
  authors: [{ name: "Lumen" }],
  creator: "Lumen",
  publisher: "Lumen",
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};
