import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { isLocale, locales, localeHtmlLang, type Locale } from "@/i18n";
import { baseMetadata, openGraphLocales } from "@/lib/metadata";
import { absoluteUrl } from "@/lib/site";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-lora",
  display: "swap",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f4ea",
  colorScheme: "light",
};

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
  const t = await getTranslations({ locale, namespace: "meta" });
  const languages = Object.fromEntries(
    locales.map((item) => [localeHtmlLang[item], absoluteUrl(`/${item}`)]),
  );

  return {
    ...baseMetadata,
    title: {
      default: t("homeTitle"),
      template: `%s · ${t("siteName")}`,
    },
    description: t("homeDescription"),
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages,
    },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: absoluteUrl(`/${locale}`),
      locale: openGraphLocales[locale],
      images: [
        {
          url: absoluteUrl("/og.jpg"),
          width: 1200,
          height: 630,
          alt: `${t("siteName")} — Biblioteca Digital Espírita Internacional`,
        },
      ],
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/favicon.svg" }],
    },
    manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={localeHtmlLang[locale]} className={`${jakarta.variable} ${lora.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider delayDuration={250}>
            <div className="flex min-h-dvh flex-col">{children}</div>
            <Toaster />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
