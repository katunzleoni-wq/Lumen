/**
 * Verifies every shipped edition:
 * - EPUB opens as a valid ZIP with a container and package document;
 * - title, author and language metadata are present;
 * - a navigable EPUB navigation document (nav) or NCX is present;
 * - a cover image is declared and exists;
 * - hashes match content/editions.lock.json;
 * - PDFs are valid and have at least one page.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { JSDOM } from "jsdom";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const books = JSON.parse(readFileSync(join(root, "content", "books.json"), "utf8")).books;
const lock = JSON.parse(readFileSync(join(root, "content", "editions.lock.json"), "utf8"));
const toc = JSON.parse(readFileSync(join(root, "content", "toc.json"), "utf8"));
const errors = [];
const rows = [];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

for (const book of books) {
  const record = lock.editions[book.slug];
  if (!record) {
    errors.push(`${book.slug}: missing lock entry`);
    continue;
  }
  if (book.pdfOnly) {
    const pdfRecord = record.pdf;
    if (!pdfRecord) {
      errors.push(`${book.slug}: PDF-only book missing PDF lock entry`);
      continue;
    }
    const pdfPath = join(root, pdfRecord.file);
    if (!existsSync(pdfPath)) {
      errors.push(`${book.slug}: PDF not found at ${pdfRecord.file}`);
      continue;
    }
    const bytes = readFileSync(pdfPath);
    if (sha256(bytes) !== pdfRecord.sha256) {
      errors.push(`${book.slug}: PDF hash does not match editions.lock.json`);
    }
    try {
      const document = await PDFDocument.load(bytes);
      const pages = document.getPageCount();
      if (pages < 1) errors.push(`${book.slug}: PDF has no pages`);
      rows.push({
        work: `${book.slug}.pdf`,
        lang: book.language,
        toc: `${pages} pages`,
        cover: "yes",
        size: `${Math.round(bytes.length / 1024)} kB`,
        hash: "ok",
      });
    } catch {
      errors.push(`${book.slug}: invalid PDF`);
    }
    continue;
  }
  const epubPath = join(root, record.file);
  if (!existsSync(epubPath)) {
    errors.push(`${book.slug}: EPUB not found at ${record.file}`);
    continue;
  }
  const bytes = readFileSync(epubPath);
  if (sha256(bytes) !== record.sha256) {
    errors.push(`${book.slug}: EPUB hash does not match editions.lock.json`);
  }

  let zip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    errors.push(`${book.slug}: EPUB is not a readable ZIP archive`);
    continue;
  }

  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) {
    errors.push(`${book.slug}: missing META-INF/container.xml rootfile`);
    continue;
  }
  const opf = await zip.file(opfPath)?.async("string");
  if (!opf) {
    errors.push(`${book.slug}: missing package document ${opfPath}`);
    continue;
  }
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const title = opf
    .match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  const creator = opf
    .match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  const language = opf.match(/<dc:language[^>]*>([\s\S]*?)<\/dc:language>/i)?.[1]?.trim();
  if (!title) errors.push(`${book.slug}: missing dc:title`);
  if (!creator) errors.push(`${book.slug}: missing dc:creator`);
  if (!language) errors.push(`${book.slug}: missing dc:language`);
  if (language && !language.toLowerCase().startsWith(book.language)) {
    errors.push(
      `${book.slug}: dc:language "${language}" differs from catalogue "${book.language}"`,
    );
  }

  const opfDom = new JSDOM(opf, { contentType: "application/xml" });
  const items = [...opfDom.window.document.getElementsByTagName("item")];
  const navItem = items.find((item) => item.getAttribute("properties")?.includes("nav"));
  const ncxItem = items.find(
    (item) => item.getAttribute("media-type") === "application/x-dtbncx+xml",
  );
  let tocEntries = 0;
  let tocKind = "none";
  if (navItem) {
    const navHref = navItem.getAttribute("href");
    const nav = navHref ? await zip.file(`${base}${navHref}`)?.async("string") : undefined;
    if (nav) {
      tocKind = "nav";
      tocEntries = (nav.match(/<a\s[^>]*href=/gi) ?? []).length;
    }
  }
  if (!tocEntries && ncxItem) {
    const ncxHref = ncxItem.getAttribute("href");
    const ncx = ncxHref ? await zip.file(`${base}${ncxHref}`)?.async("string") : undefined;
    if (ncx) {
      tocKind = "ncx";
      tocEntries = (ncx.match(/<navPoint\b/gi) ?? []).length;
    }
  }
  if (tocEntries < 1) errors.push(`${book.slug}: no navigable TOC entries`);

  const coverMeta = opfDom.window.document.getElementsByTagName("meta").length
    ? [...opfDom.window.document.getElementsByTagName("meta")]
        .find((meta) => meta.getAttribute("name") === "cover")
        ?.getAttribute("content")
    : undefined;
  const coverItem = items.find((item) => item.getAttribute("properties")?.includes("cover-image"));
  const coverHref =
    coverItem?.getAttribute("href") ??
    (coverMeta
      ? items.find((item) => item.getAttribute("id") === coverMeta)?.getAttribute("href")
      : undefined);
  if (!coverHref) {
    errors.push(`${book.slug}: no cover declared in package document`);
  } else {
    const coverPath = `${base}${coverHref}`;
    if (!zip.file(coverPath)) errors.push(`${book.slug}: cover file ${coverPath} is absent`);
  }

  const tocFile = toc[book.slug] ?? [];
  if (tocFile.length < 1) errors.push(`${book.slug}: empty content/toc.json entry`);

  rows.push({
    work: book.slug,
    lang: book.language,
    toc: `${tocEntries} (${tocKind})`,
    cover: coverHref ? "yes" : "no",
    size: `${Math.round(bytes.length / 1024)} kB`,
    hash: "ok",
  });
}

const pdfBook = books.find((book) => book.formats.includes("pdf"));
if (!pdfBook) {
  errors.push("catalogue has no public-domain PDF");
} else {
  const record = lock.editions[pdfBook.slug]?.pdf;
  if (!record) {
    errors.push(`${pdfBook.slug}: PDF missing from lock file`);
  } else {
    const pdfPath = join(root, record.file);
    if (!existsSync(pdfPath)) {
      errors.push(`${pdfBook.slug}: PDF not found`);
    } else {
      const bytes = readFileSync(pdfPath);
      if (sha256(bytes) !== record.sha256) errors.push(`${pdfBook.slug}: PDF hash mismatch`);
      try {
        const document = await PDFDocument.load(bytes);
        const pages = document.getPageCount();
        if (pages < 1) errors.push(`${pdfBook.slug}: PDF has no pages`);
        rows.push({
          work: `${pdfBook.slug}.pdf`,
          lang: pdfBook.language,
          toc: `${pages} pages`,
          cover: "scan",
          size: `${Math.round(bytes.length / 1024)} kB`,
          hash: "ok",
        });
      } catch {
        errors.push(`${pdfBook.slug}: invalid PDF`);
      }
    }
  }
}

console.table(rows);
if (errors.length) {
  console.error("\nEdition validation failed:");
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`\nAll ${books.length} editions passed structural validation.`);
