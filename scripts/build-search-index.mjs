/**
 * Builds the static, multilingual Pagefind index.
 *
 * Pagefind indexes static HTML by design. Rather than depending on framework
 * output internals, we feed it one explicit record per route and locale. This
 * keeps the index deterministic and lets us attach typed filters (locale, type
 * and category) that the search UI relies on.
 */
import { readFileSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createIndex, close } from "pagefind";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const locales = ["pt", "en", "es", "fr"];
const defaultLocale = "pt";

const booksFile = JSON.parse(readFileSync(join(root, "content", "books.json"), "utf8"));
const samples = JSON.parse(readFileSync(join(root, "content", "samples.json"), "utf8"));
const messages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(readFileSync(join(root, "src", "messages", `${locale}.json`), "utf8")),
  ]),
);

const { books, categories } = booksFile;
const outputPath = join(root, "public", "pagefind");

rmSync(outputPath, { recursive: true, force: true });
mkdirSync(outputPath, { recursive: true });

function t(locale, key) {
  const value = key.split(".").reduce((current, part) => current?.[part], messages[locale]);
  return typeof value === "string" ? value : "";
}

function localized(value, locale) {
  return value?.[locale] ?? value?.[defaultLocale] ?? "";
}

async function main() {
  const { errors, index } = await createIndex({ verbose: false });
  if (!index) {
    throw new Error(`Pagefind could not create an index:\n${errors.join("\n")}`);
  }

  let records = 0;

  async function add(record) {
    const response = await index.addCustomRecord(record);
    if (response.errors.length > 0) {
      throw new Error(`Pagefind failed on ${record.url}:\n${response.errors.join("\n")}`);
    }
    records += 1;
  }

  for (const locale of locales) {
    const baseFilters = { locale: [locale] };
    const homeTitle = t(locale, "meta.homeTitle");
    const tagline = t(locale, "hero.tagline");
    const intro = t(locale, "hero.description");

    await add({
      url: `/${locale}`,
      language: locale,
      content: `${homeTitle}. ${tagline}. ${intro} ${t(locale, "home.quote")} ${t(
        locale,
        "home.featuredTitle",
      )} ${t(locale, "home.featuredDescription")} ${t(locale, "home.categoriesTitle")} ${t(
        locale,
        "home.aboutBody",
      )}`,
      meta: { title: homeTitle, type: "page" },
      filters: { ...baseFilters, type: ["page"] },
    });

    const catalogContent = books
      .map(
        (book) =>
          `${localized(book.title, locale)} — ${book.author}. ${localized(book.description, locale)}`,
      )
      .join(" ");
    await add({
      url: `/${locale}/biblioteca`,
      language: locale,
      content: `${t(locale, "library.title")}. ${t(locale, "library.description")} ${catalogContent}`,
      meta: { title: t(locale, "library.title"), type: "page" },
      filters: { ...baseFilters, type: ["page"] },
    });

    await add({
      url: `/${locale}/sobre`,
      language: locale,
      content: `${t(locale, "about.title")}. ${t(locale, "about.lead")} ${t(
        locale,
        "about.missionTitle",
      )} ${t(locale, "about.missionBody")} ${t(locale, "about.preservationTitle")} ${t(
        locale,
        "about.preservationBody",
      )}`,
      meta: { title: t(locale, "about.title"), type: "page" },
      filters: { ...baseFilters, type: ["page"] },
    });

    for (const book of books) {
      const category = categories.find((item) => item.id === book.category);
      const categoryName = category ? localized(category.name, locale) : book.category;
      const sample = book.language === locale ? samples[book.slug] : undefined;
      const sampleContent = sample
        ? sample.chapters.flatMap((chapter) => [chapter.title, ...chapter.paragraphs]).join(" ")
        : "";
      await add({
        url: `/${locale}/livro/${book.slug}`,
        language: locale,
        content: [
          localized(book.title, locale),
          localized(book.subtitle, locale),
          book.author,
          book.originalTitle,
          String(book.year),
          localized(book.description, locale),
          categoryName,
          t(locale, "book.readSample"),
          t(locale, "book.epub"),
          t(locale, "book.pdf"),
          sampleContent,
        ].join(". "),
        meta: {
          title: localized(book.title, locale),
          author: book.author,
          description: localized(book.description, locale),
          category: categoryName,
          type: "book",
        },
        filters: {
          ...baseFilters,
          type: ["book"],
          category: [book.category],
          format: book.formats,
        },
        sort: { year: String(book.year) },
      });
    }
  }

  const result = await index.writeFiles({ outputPath });
  if (result.errors.length > 0) {
    throw new Error(`Pagefind could not write the index:\n${result.errors.join("\n")}`);
  }

  console.log(`[pagefind] ${records} records indexed in 4 languages → public/pagefind`);
}

try {
  await main();
} catch (error) {
  console.error("[pagefind] build failed:", error);
  process.exitCode = 1;
} finally {
  await close();
}
