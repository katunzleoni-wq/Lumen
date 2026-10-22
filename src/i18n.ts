import { getRequestConfig } from "next-intl/server";
import en from "./messages/en.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import pt from "./messages/pt.json";

export const locales = ["pt", "en", "es", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export const localeLabels: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
};

export const localeHtmlLang: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
  fr: "fr",
};

const messages = { pt, en, es, fr } as const;

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const safeLocale: Locale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale: safeLocale,
    messages: messages[safeLocale],
    timeZone: "America/Sao_Paulo",
    now: new Date(),
  };
});
