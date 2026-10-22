/**
 * Builds a Lumen-hosted Portuguese edition from the FEB/Guillon text.
 *
 * The FEB authorization covers the translation text and permits PDF/EPUB
 * reproduction, but excludes FEB covers, logos, layout and editorial matter.
 * This script therefore extracts only the body text from the source PDF and
 * typesets a new Lumen edition with its own cover and the required credits.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import epubGenModule from "epub-gen-memory";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const coverDir = join(root, "public", "covers");
const bookDir = join(root, "public", "books");
const rawDir = join(root, "content-sources", "raw", "celp");
mkdirSync(coverDir, { recursive: true });
mkdirSync(bookDir, { recursive: true });

const epub = typeof epubGenModule === "function" ? epubGenModule : epubGenModule.default;
const config = {
  slug: "o-livro-dos-espiritos",
  source: "o-livro-dos-espiritos.pdf",
  startPage: 13,
  title: "O Livro dos Espíritos",
  subtitle: "Princípios da Doutrina Espírita",
  author: "Allan Kardec",
  translator: "Guillon Ribeiro",
  license:
    "Obra de Allan Kardec. Tradução de Guillon Ribeiro. Tradução e edição © Federação Espírita Brasileira. Uso autorizado ao projeto Lumen para disponibilização gratuita e sem fins lucrativos.",
  description:
    "Princípios da Doutrina Espírita sobre a imortalidade da alma, a natureza dos Espíritos e suas relações com os homens, as leis morais, a vida presente e a vida futura.",
  year: 1857,
  editionNote:
    "Edição Lumen preparada a partir do texto da tradução de Guillon Ribeiro, com autorização da FEB.",
};

const cleanSpaces = (value) => value.replace(/\s+/g, " ").trim();
const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function linesFromPage(content) {
  const items = content.items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => ({
      text: cleanSpaces(item.str),
      x: item.transform[4],
      y: item.transform[5],
    }))
    .sort((a, b) => (Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x));
  const lines = [];
  for (const item of items) {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= 2);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => {
      line.items.sort((a, b) => a.x - b.x);
      return {
        text: cleanSpaces(line.items.map((item) => item.text).join(" ")),
        x: Math.min(...line.items.map((item) => item.x)),
      };
    })
    .filter((line) => line.text.length > 0);
}

function chapterNumber(line) {
  const match = line.match(/^CAP[IÍ]TULO\s+([IVXLCDM]+)\.?\s*$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function romanToInt(value) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let previous = 0;
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const current = map[value[index]] ?? 0;
    total += current < previous ? -current : current;
    previous = current;
  }
  return total;
}

const TITLE_FIXES = {};

function isAllCaps(value) {
  const letters = value.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return letters.length > 2 && letters.replace(/[a-zà-ÿ]/g, "").length / letters.length > 0.7;
}

function isRunningHeader(line, shortTitle, chapter) {
  if (/^\d{1,4}$/.test(line)) return true;
  if (/^ALLAN\s+KARDEC$/i.test(line)) return true;
  if (/^O\s+LIVRO\s+DOS\s+ESP[ÍI]RITOS$/i.test(line)) return true;
  if (/^PARTE\s+\d/i.test(line)) return true;
  if (/^I\s*N\s*T\s*R\s*O\s*D\s*U\s*Ç\s*Ã\s*O$/i.test(line)) return true;
  if (shortTitle && line.toUpperCase() === shortTitle.toUpperCase()) return true;
  if (chapter && line.toUpperCase() === chapter.toUpperCase()) return true;
  return false;
}

async function extractChapters() {
  const sourcePath = join(rawDir, config.source);
  if (!existsSync(sourcePath)) throw new Error(`Missing ${config.source}`);
  const document = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(sourcePath)),
    useWorkerFetch: false,
    isEvalSupported: false,
    standardFontDataUrl: join(root, "public", "pdfjs", "standard_fonts") + "/",
  }).promise;

  const chapters = [];
  let current = { title: "Introdução", shortTitle: "INTRODUÇÃO", part: "", blocks: [], para: null };
  chapters.push(current);
  let currentChapterNumber = null;
  let pendingPart = "";
  let finished = false;

  const flushParagraph = () => {
    if (current.para && current.para.length > 0) {
      current.blocks.push({ type: "p", text: current.para });
      current.para = null;
    }
  };
  const addParagraphLine = (line) => {
    if (!current.para) current.para = line;
    else current.para += ` ${line}`;
  };
  const startChapter = (number, title) => {
    flushParagraph();
    currentChapterNumber = number;
    const prefix = pendingPart ? `${pendingPart} — ` : "";
    const heading = number
      ? `Capítulo ${number}${title ? ` — ${title}` : ""}`
      : title || "Introdução";
    current = {
      title: `${prefix}${heading}`,
      shortTitle: title || (number ? `CAPÍTULO ${number}` : "INTRODUÇÃO"),
      part: pendingPart,
      blocks: [],
      para: null,
    };
    chapters.push(current);
  };

  for (
    let pageNumber = config.startPage;
    pageNumber <= document.numPages && !finished;
    pageNumber += 1
  ) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = linesFromPage(content);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (isRunningHeader(line.text, current.shortTitle, currentChapterNumber)) continue;
      if (/^Nota Especial\b/i.test(line.text) && current.title === "Conclusão") {
        // The FEB printing appends two editorial notes after Kardec's text.
        // They are not part of the authorized body text, so stop here.
        finished = true;
        break;
      }
      const partMatch = line.text.match(/^PARTE\s+(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA)$/i);
      if (partMatch) {
        const labels = {
          PRIMEIRA: "Primeira parte",
          SEGUNDA: "Segunda parte",
          TERCEIRA: "Terceira parte",
          QUARTA: "Quarta parte",
        };
        const subtitleParts = [];
        for (let cursor = index + 1; cursor < Math.min(index + 4, lines.length); cursor += 1) {
          const next = lines[cursor];
          if (/^CAP[IÍ]TULO\b/i.test(next.text)) break;
          if (next.x < 140 || next.text.length > 120) break;
          subtitleParts.push(next.text);
          index = cursor;
        }
        pendingPart = subtitleParts.length
          ? `${labels[partMatch[1].toUpperCase()]} — ${subtitleParts.join(" ")}`
          : labels[partMatch[1].toUpperCase()];
        currentChapterNumber = null;
        continue;
      }
      if (/^PROLEG[ÔO]MENOS$/i.test(line.text)) {
        pendingPart = "";
        startChapter(null, "Prolegômenos");
        continue;
      }
      if (/^CONCLUS[ÃA]O$/i.test(line.text)) {
        pendingPart = "";
        startChapter(null, "Conclusão");
        continue;
      }
      if (/^INTRODU[CÇ][AÃ]O$/i.test(line.text) && current.title !== "Introdução") {
        pendingPart = "";
        startChapter(null, "Introdução");
        continue;
      }
      const number = chapterNumber(line.text);
      if (number) {
        const preview = lines[index + 1]?.text ?? "";
        // The 1995 FEB printing misnumbers the chapter "Da lei do
        // progresso" as VI on its opening page; the TOC and sequence
        // identify it as VIII. Keep the body text untouched.
        const resolvedNumber =
          number === "VI" && /LEI\s+DO\s+PROGRESSO/i.test(preview) ? "VIII" : number;
        const nextNumber = currentChapterNumber ? romanToInt(currentChapterNumber) + 1 : 1;
        const isNextChapter =
          currentChapterNumber === null || romanToInt(resolvedNumber) === nextNumber;
        if (isNextChapter) {
          const titleParts = [];
          for (let cursor = index + 1; cursor < Math.min(index + 4, lines.length); cursor += 1) {
            const next = lines[cursor];
            if (next.x < 140 || next.text.length > 160) break;
            if (isRunningHeader(next.text, "", "")) break;
            if (!isAllCaps(next.text)) break;
            titleParts.push(next.text);
            index = cursor;
          }
          const title =
            TITLE_FIXES[resolvedNumber] ?? titleParts.join(" ").replace(/\s+/g, " ").trim();
          startChapter(resolvedNumber, title);
        }
        continue;
      }
      if (line.x > 140 && line.text.length < 120) {
        // Centered subheading inside a chapter, e.g. a section title.
        flushParagraph();
        current.blocks.push({ type: "h3", text: line.text });
        continue;
      }
      if (line.x >= 105) {
        flushParagraph();
        current.para = line.text;
      } else if (current.para) {
        addParagraphLine(line.text);
      } else {
        current.para = line.text;
      }
    }
  }
  flushParagraph();
  return chapters
    .map((chapter) => ({
      ...chapter,
      blocks: chapter.blocks.filter((block) => block.text.length > 1),
    }))
    .filter((chapter) => chapter.blocks.length > 0);
}

function wrapTitle(text, maxChars = 18) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function coverSvg() {
  const titleLines = wrapTitle(config.title);
  const titleStart = 455 - (titleLines.length - 1) * 27;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-label="Capa de ${escapeHtml(config.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#182d44"/><stop offset=".55" stop-color="#31536f"/><stop offset="1" stop-color="#182d44"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect x="25" y="25" width="550" height="850" fill="none" stroke="#f7f1e3" stroke-opacity=".22"/>
  <text x="300" y="86" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="7" fill="#f7f1e3" fill-opacity=".85">LUMEN</text>
  <text x="300" y="108" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7" letter-spacing="2" fill="#f7f1e3" fill-opacity=".55">BIBLIOTECA DIGITAL ESPÍRITA INTERNACIONAL</text>
  <g fill="none" stroke="#d8bd83" stroke-width="1.1" opacity=".55">
    <circle cx="300" cy="295" r="135"/><circle cx="300" cy="295" r="198" opacity=".45"/>
    <path d="M120 295h360M300 115v360" opacity=".3"/>
  </g>
  ${titleLines
    .map(
      (line, index) =>
        `<text x="300" y="${titleStart + index * 55}" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="#f7f1e3">${escapeHtml(line)}</text>`,
    )
    .join("")}
  <line x1="238" y1="${titleStart + titleLines.length * 55 - 6}" x2="362" y2="${titleStart + titleLines.length * 55 - 6}" stroke="#d8bd83"/>
  <text x="300" y="${titleStart + titleLines.length * 55 + 30}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="2.4" fill="#f7f1e3" fill-opacity=".85">ALLAN KARDEC</text>
  <text x="300" y="742" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#f7f1e3" fill-opacity=".8">${escapeHtml(config.subtitle)}</text>
  <text x="300" y="790" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="8" letter-spacing="1.3" fill="#f7f1e3" fill-opacity=".62">TRADUÇÃO DE GUILLON RIBEIRO · EDIÇÃO LUMEN</text>
  <text x="300" y="820" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7" letter-spacing="1.1" fill="#f7f1e3" fill-opacity=".48">TEXTO INTEGRAL · USO AUTORIZADO PELA FEB · NÃO COMERCIAL</text>
</svg>`;
}

function blocksToHtml(blocks) {
  return blocks
    .map((block) =>
      block.type === "h3"
        ? `<h3>${escapeHtml(block.text)}</h3>`
        : `<p>${escapeHtml(block.text)}</p>`,
    )
    .join("\n");
}

function licenseBlock() {
  return `<div class="license-box">
    <p><strong>${escapeHtml(config.license)}</strong></p>
    <p>Licença concedida pela Federação Espírita Brasileira em 22/10/2026, por 6 anos, para uso não comercial no projeto Lumen. Texto integral, sem alterações. Capa e projeto gráfico: Lumen.</p>
  </div>`;
}

function buildHtml(chapters, coverData) {
  const toc = chapters
    .map((chapter, index) => `<li><a href="#cap-${index}">${escapeHtml(chapter.title)}</a></li>`)
    .join("");
  const sections = chapters
    .map(
      (chapter, index) => `<section class="chapter" id="cap-${index}">
        <h2>${escapeHtml(chapter.title)}</h2>
        ${blocksToHtml(chapter.blocks)}
        ${licenseBlock()}
      </section>`,
    )
    .join("\n");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>${escapeHtml(config.title)} — ${escapeHtml(config.author)}</title>
  <meta name="author" content="${escapeHtml(config.author)}">
  <meta name="description" content="${escapeHtml(config.description)}">
  <style>
    @page { size: A5; margin: 16mm 14mm 18mm; }
    @page:first { margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1e2a30; font-family: Georgia, "Times New Roman", serif; font-size: 10.3pt; line-height: 1.55; }
    .cover { height: 210mm; margin: 0; page-break-after: always; }
    .cover img { width: 100%; height: 100%; display: block; object-fit: cover; }
    .front { page-break-after: always; padding-top: 18mm; }
    .front h1 { font-size: 24pt; line-height: 1.1; margin: 0 0 8mm; }
    .front .sub { font-style: italic; font-size: 13pt; color: #4b5b64; }
    .front .meta { margin-top: 18mm; font-size: 10pt; color: #5f6c73; }
    .license-box { margin-top: 14mm; border-top: 1px solid #d8c9a7; padding-top: 5mm; font-size: 8.2pt; line-height: 1.45; color: #5a5a55; }
    .toc { page-break-after: always; }
    .toc h2 { font-size: 18pt; margin: 0 0 8mm; }
    .toc ol { padding-left: 6mm; font-size: 9.5pt; }
    .toc li { margin: 0 0 2.5mm; }
    .chapter { page-break-before: always; }
    .chapter h2 { font-size: 18pt; line-height: 1.15; margin: 0 0 7mm; color: #1c4052; }
    .chapter h3 { font-size: 11.5pt; margin: 6mm 0 2mm; color: #31536f; }
    p { margin: 0 0 3.2mm; text-align: justify; hyphens: auto; }
    a { color: inherit; text-decoration: none; }
  </style></head><body>
    <div class="cover"><img src="${coverData}" alt="Capa de ${escapeHtml(config.title)}"></div>
    <section class="front">
      <h1>${escapeHtml(config.title)}</h1>
      <p class="sub">${escapeHtml(config.subtitle)}</p>
      <p class="meta"><strong>${escapeHtml(config.author)}</strong><br>
      Tradução de ${escapeHtml(config.translator)}<br>
      ${escapeHtml(config.editionNote)}<br>
      Edição em português · ${config.year}</p>
      ${licenseBlock()}
    </section>
    <section class="toc"><h2>Sumário</h2><ol>${toc}</ol></section>
    ${sections}
  </body></html>`;
}

async function main() {
  const chapters = await extractChapters();
  console.log(`[feb] ${chapters.length} sections extracted`);
  const svg = coverSvg();
  writeFileSync(join(coverDir, `${config.slug}.svg`), svg);

  const browser = await chromium.launch();
  try {
    const coverPage = await browser.newPage({ viewport: { width: 600, height: 900 } });
    const encoded = Buffer.from(svg).toString("base64");
    const coverData = `data:image/svg+xml;base64,${encoded}`;
    await coverPage.setContent(
      `<style>html,body{margin:0;background:#000}img{display:block;width:600px;height:900px}</style><img src="${coverData}" alt="">`,
      { waitUntil: "networkidle" },
    );
    const coverPng = join(root, "content-sources", "build", `${config.slug}.png`);
    mkdirSync(dirname(coverPng), { recursive: true });
    await coverPage.screenshot({ path: coverPng });
    await coverPage.close();

    const html = buildHtml(chapters, coverData);
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(html, { waitUntil: "load", timeout: 120_000 });
    await pdfPage.emulateMedia({ media: "print" });
    const pdfPath = join(bookDir, `${config.slug}.pdf`);
    await pdfPage.pdf({
      path: pdfPath,
      format: "A5",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="width:100%;font-family:Arial,sans-serif;font-size:6.5px;color:#6b6b66;text-align:center;padding:0 12mm;">Allan Kardec · Tradução de Guillon Ribeiro · © FEB · Uso autorizado ao projeto Lumen · não comercial</div>',
      margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
    await pdfPage.close();

    const epubChapters = [
      {
        title: "Nota sobre esta edição",
        content: `<p>${escapeHtml(config.editionNote)}</p>${licenseBlock()}`,
        beforeToc: true,
      },
      ...chapters.map((chapter) => ({
        title: chapter.title,
        content: `${blocksToHtml(chapter.blocks)}${licenseBlock()}`,
      })),
    ];
    const epubBuffer = await epub(
      {
        title: config.title,
        author: config.author,
        publisher: "Lumen · com autorização da FEB",
        description: config.description,
        cover: pathToFileURL(coverPng).href,
        lang: "pt",
        date: String(config.year),
        tocTitle: "Sumário",
        numberChaptersInTOC: false,
        prependChapterTitles: true,
        version: 3,
        css: "body{font-family:Georgia,serif;line-height:1.7;color:#1e2a30;padding:0 6%;}p{text-align:justify;hyphens:auto;margin:0 0 .9em;}h2{color:#1c4052;} .license-box{font-family:sans-serif;font-size:.78em;color:#5a5a55;border-top:1px solid #d8c9a7;padding-top:1em;margin-top:1.5em;}",
      },
      epubChapters,
      3,
    );
    const epubPath = join(bookDir, `${config.slug}.epub`);
    writeFileSync(epubPath, Buffer.from(epubBuffer));

    const pdfBytes = readFileSync(pdfPath);
    const pdfMeta = await PDFDocument.load(pdfBytes);
    const epubBytes = readFileSync(epubPath);
    const lock = {
      generatedAt: "2026-10-22",
      config,
      chapters: chapters.length,
      pdf: {
        file: `public/books/${config.slug}.pdf`,
        bytes: pdfBytes.length,
        pages: pdfMeta.getPageCount(),
        sha256: createHash("sha256").update(pdfBytes).digest("hex"),
      },
      epub: {
        file: `public/books/${config.slug}.epub`,
        bytes: epubBytes.length,
        sha256: createHash("sha256").update(epubBytes).digest("hex"),
      },
    };
    writeFileSync(
      join(root, "content", "feb-espiritos.lock.json"),
      `${JSON.stringify(lock, null, 2)}\n`,
    );

    const editionsLockPath = join(root, "content", "editions.lock.json");
    const editionsLock = JSON.parse(readFileSync(editionsLockPath, "utf8"));
    editionsLock.generatedAt = "2026-10-22";
    editionsLock.editions[config.slug] = {
      file: lock.epub.file,
      sha256: lock.epub.sha256,
      bytes: lock.epub.bytes,
      language: "pt",
      chapters: chapters.length,
      strategy: "feb",
      pdf: {
        file: lock.pdf.file,
        sha256: lock.pdf.sha256,
        bytes: lock.pdf.bytes,
      },
    };
    writeFileSync(editionsLockPath, `${JSON.stringify(editionsLock, null, 2)}\n`);
    console.log(`[feb] PDF ${pdfMeta.getPageCount()} pages, EPUB ${chapters.length + 1} sections`);
    console.log(`[feb] ${pdfPath}`);
    console.log(`[feb] ${epubPath}`);
  } finally {
    await browser.close();
  }
}

await main();
