import type { MetadataRoute } from "next";
import { books } from "@/content/books";
import { localeHtmlLang, locales } from "@/i18n";
import { absoluteUrl } from "@/lib/site";

function languages(pathForLocale: (locale: (typeof locales)[number]) => string) {
  return Object.fromEntries(
    locales.map((locale) => [localeHtmlLang[locale], absoluteUrl(pathForLocale(locale))]),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/biblioteca", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/sobre", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/licencas", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  const staticRoutes = locales.flatMap((locale) =>
    staticPaths.map((page) => ({
      url: absoluteUrl(`/${locale}${page.path}`),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: languages((item) => `/${item}${page.path}`),
      },
    })),
  );

  const bookRoutes = locales.flatMap((locale) =>
    books.map((book) => ({
      url: absoluteUrl(`/${locale}/livro/${book.slug}`),
      lastModified: new Date(book.addedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: languages((item) => `/${item}/livro/${book.slug}`),
      },
    })),
  );

  return [...staticRoutes, ...bookRoutes];
}
