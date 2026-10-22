/**
 * Validates the FEB-authorized Portuguese edition: PDF/EPUB integrity, hashes,
 * chapter navigation, cover and the required credit line.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { JSDOM } from "jsdom";
import { PDFDocument } from "pdf-lib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const lockFile = process.argv[2] ?? "content/feb-editions.lock.json";
const lock = JSON.parse(readFileSync(join(root, lockFile), "utf8"));
const errors = [];
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

for (const format of ["pdf", "epub"]) {
  const record = lock[format];
  const path = join(root, record.file);
  if (!existsSync(path)) {
    errors.push(`${format}: missing ${record.file}`);
    continue;
  }
  const bytes = readFileSync(path);
  if (bytes.length !== record.bytes) errors.push(`${format}: size mismatch`);
  if (sha(bytes) !== record.sha256) errors.push(`${format}: hash mismatch`);
  if (format === "pdf") {
    const pdf = await PDFDocument.load(bytes);
    if (pdf.getPageCount() !== record.pages) {
      errors.push(`pdf: expected ${record.pages} pages, found ${pdf.getPageCount()}`);
    }
  } else {
    const zip = await JSZip.loadAsync(bytes);
    const container = await zip.file("META-INF/container.xml")?.async("string");
    const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
    const opf = opfPath ? await zip.file(opfPath)?.async("string") : undefined;
    if (!opf) errors.push("epub: missing package document");
    const base = opfPath?.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
    const opfDom = new JSDOM(opf ?? "", { contentType: "application/xml" });
    const items = [...opfDom.window.document.getElementsByTagName("item")];
    const navItem = items.find((item) => item.getAttribute("properties")?.includes("nav"));
    const ncxItem = items.find(
      (item) => item.getAttribute("media-type") === "application/x-dtbncx+xml",
    );
    let tocEntries = 0;
    if (ncxItem) {
      const ncxHref = ncxItem.getAttribute("href");
      const ncx = ncxHref ? await zip.file(`${base}${ncxHref}`)?.async("string") : undefined;
      tocEntries = ncx ? (ncx.match(/<navPoint\b/gi) ?? []).length : 0;
    }
    if (!tocEntries && navItem) {
      const navHref = navItem.getAttribute("href");
      const nav = navHref ? await zip.file(`${base}${navHref}`)?.async("string") : undefined;
      tocEntries = nav ? (nav.match(/<a\s[^>]*href=/gi) ?? []).length : 0;
    }
    const expectedTocEntries = (lock.chapters ?? 30) + 1;
    if (tocEntries < expectedTocEntries) {
      errors.push(`epub: expected at least ${expectedTocEntries} TOC entries, found ${tocEntries}`);
    }
    const coverMeta = [...opfDom.window.document.getElementsByTagName("meta")]
      .find((meta) => meta.getAttribute("name") === "cover")
      ?.getAttribute("content");
    const coverItem = items.find((item) =>
      item.getAttribute("properties")?.includes("cover-image"),
    );
    const coverHref =
      coverItem?.getAttribute("href") ??
      (coverMeta
        ? items.find((item) => item.getAttribute("id") === coverMeta)?.getAttribute("href")
        : undefined);
    if (!coverHref) errors.push("epub: no cover declared");
    if (coverHref && !zip.file(`${base}${coverHref}`)) errors.push("epub: cover file missing");
    const chapterFiles = Object.keys(zip.files).filter(
      (name) => /\.xhtml$/i.test(name) && !/toc|nav|cover/i.test(name),
    );
    let foundCredit = false;
    for (const file of chapterFiles) {
      const html = await zip.file(file)?.async("string");
      if (!html) continue;
      const text = new JSDOM(html).window.document.body.textContent ?? "";
      if (/Guillon Ribeiro/.test(text) && /Federa/.test(text)) {
        foundCredit = true;
        break;
      }
    }
    if (!foundCredit) errors.push("epub: required Guillon/FEB credit not found in chapters");
  }
}

console.log({
  edition: lock.config.slug,
  chapters: lock.chapters,
  pdf: `${lock.pdf.pages} pages, ${Math.round(lock.pdf.bytes / 1024)} kB`,
  epub: `${Math.round(lock.epub.bytes / 1024)} kB`,
});
if (errors.length) {
  console.error("FEB edition validation failed:");
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log("FEB-authorized Portuguese edition passed validation.");
