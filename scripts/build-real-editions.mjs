/**
 * Builds the public-domain editions shipped with Lumen.
 *
 * Sources:
 * - Internet Archive OCR of 19th-century French editions (Public Domain Mark);
 * - French Wikisource transcription of the 1860 edition of "Le Livre des Esprits"
 *   (the work is public domain; the transcription is CC BY-SA 4.0);
 * - official Project Gutenberg EPUB3 files.
 *
 * The script expects source files in content-sources/raw (see
 * `npm run sources:fetch`) and writes the editions, covers, TOC and a manifest.
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import epubGenModule from "epub-gen-memory";
import { chromium } from "@playwright/test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rawDir = join(root, "content-sources", "raw");
const buildDir = join(root, "content-sources", "build");
const coverDir = join(root, "public", "covers");
const bookDir = join(root, "public", "books");
mkdirSync(buildDir, { recursive: true });
mkdirSync(coverDir, { recursive: true });
mkdirSync(bookDir, { recursive: true });

const epub = typeof epubGenModule === "function" ? epubGenModule : epubGenModule.default;
const books = JSON.parse(readFileSync(join(root, "content", "books.json"), "utf8")).books;
const editions = JSON.parse(readFileSync(join(root, "content", "editions.json"), "utf8"));

const cleanSpaces = (value) => value.replace(/\s+/g, " ").trim();

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hasRaw(file) {
  return existsSync(join(rawDir, file));
}

const coverLabels = {
  fr: "ÉDITION INTÉGRALE · DOMAINE PUBLIC",
  en: "COMPLETE EDITION · PUBLIC DOMAIN",
};

const motifMap = {
  orbit: (accent) => `
    <g fill="none" stroke="${accent}" stroke-width="1.1" opacity=".7">
      <ellipse cx="300" cy="292" rx="210" ry="92" transform="rotate(-24 300 292)"/>
      <circle cx="300" cy="292" r="150" opacity=".5"/>
      <circle cx="432" cy="198" r="5" fill="${accent}" stroke="none"/>
    </g>
    <circle cx="300" cy="292" r="48" fill="${accent}" opacity=".18"/>`,
  arches: (accent) => `
    <g fill="none" stroke="${accent}" stroke-width="1.4" opacity=".65">
      <path d="M120 520V320a180 180 0 0 1 360 0v200"/>
      <path d="M160 520V328a140 140 0 0 1 280 0v192" opacity=".7"/>
      <path d="M200 520V336a100 100 0 0 1 200 0v184" opacity=".42"/>
    </g>`,
  constellation: (accent) => `
    <g stroke="${accent}" stroke-width="1" opacity=".55">
      <path d="M148 392l52-77 74 28 46-92 78 61 66-40"/>
      <path d="M200 315l24 89 50-62 74 105 42-129"/>
    </g>
    <g fill="${accent}">
      <circle cx="148" cy="392" r="3"/><circle cx="200" cy="315" r="5"/>
      <circle cx="320" cy="251" r="4"/><circle cx="398" cy="312" r="3"/>
      <circle cx="348" cy="509" r="3"/><circle cx="390" cy="380" r="2.4"/>
    </g>`,
  seed: (accent) => `
    <g fill="none" stroke="${accent}" stroke-width="1.2" opacity=".65">
      <path d="M300 500V250"/>
      <path d="M300 354c-76 0-118-44-118-111 76 0 118 44 118 111z"/>
      <path d="M300 412c76 0 118-44 118-111-76 0-118 44-118 111z"/>
      <path d="M300 270c-34-24-47-57-35-100 35 17 52 48 35 100z"/>
    </g>`,
  rays: (accent) => `
    <g stroke="${accent}" stroke-width="1.1" opacity=".52">
      ${Array.from({ length: 15 }, (_, index) => {
        const angle = (-90 + index * 12) * (Math.PI / 180);
        return `<line x1="${(300 + Math.cos(angle) * 70).toFixed(1)}" y1="${(
          310 +
          Math.sin(angle) * 70
        ).toFixed(1)}" x2="${(300 + Math.cos(angle) * 200).toFixed(1)}" y2="${(
          310 +
          Math.sin(angle) * 200
        ).toFixed(1)}"/>`;
      }).join("")}
    </g>
    <circle cx="300" cy="310" r="45" fill="${accent}" opacity=".2"/>`,
  moon: (accent) => `
    <circle cx="300" cy="292" r="108" fill="${accent}" opacity=".12"/>
    <path d="M346 201a104 104 0 1 0 55 155 86 86 0 0 1-55-155z" fill="${accent}" opacity=".45"/>
    <g fill="${accent}" opacity=".65">
      <circle cx="184" cy="176" r="2"/><circle cx="412" cy="153" r="2.8"/>
      <circle cx="448" cy="345" r="1.8"/><circle cx="153" cy="401" r="2.4"/>
    </g>`,
  waves: (accent) => `
    <g fill="none" stroke="${accent}" stroke-width="1.2" opacity=".6">
      <path d="M-20 292c70-54 142-54 212 0s142 54 212 0 142-54 212 0"/>
      <path d="M-20 340c70-54 142-54 212 0s142 54 212 0 142-54 212 0" opacity=".7"/>
      <path d="M-20 388c70-54 142-54 212 0s142 54 212 0 142-54 212 0" opacity=".45"/>
    </g>`,
  grid: (accent) => `
    <g stroke="${accent}" stroke-width=".7" opacity=".32">
      ${Array.from({ length: 13 }, (_, i) => `<line x1="90" y1="${175 + i * 24}" x2="510" y2="${175 + i * 24}"/>`).join("")}
      ${Array.from({ length: 10 }, (_, i) => `<line x1="${120 + i * 40}" y1="150" x2="${120 + i * 40}" y2="500"/>`).join("")}
    </g>
    <rect x="248" y="268" width="104" height="104" fill="${accent}" opacity=".14"/>`,
};

function wrapTitle(text, maxChars = 19) {
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

function coverSvg(book) {
  const [base, mid, accent] = book.palette;
  const title = book.title[book.language] ?? book.title.fr;
  const lines = wrapTitle(title);
  const startY = 476 - (lines.length - 1) * 27;
  const motif = motifMap[book.motif] ?? motifMap.orbit;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-label="Capa de ${escapeHtml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/>
      <stop offset=".6" stop-color="${mid}"/>
      <stop offset="1" stop-color="${base}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".32" r=".6">
      <stop offset="0" stop-color="${accent}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".045"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect width="600" height="900" fill="url(#glow)"/>
  <rect x="24" y="24" width="552" height="852" fill="none" stroke="#f8f3e8" stroke-opacity=".2"/>
  <text x="300" y="84" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="7" fill="#f8f3e8" fill-opacity=".82">LUMEN</text>
  <text x="300" y="107" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7.4" letter-spacing="2.2" fill="#f8f3e8" fill-opacity=".52">BIBLIOTECA DIGITAL ESPÍRITA INTERNACIONAL</text>
  ${motif(accent)}
  ${lines
    .map(
      (line, index) =>
        `<text x="300" y="${startY + index * 56}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" letter-spacing="-.5" fill="#f8f3e8">${escapeHtml(
          line,
        )}</text>`,
    )
    .join("")}
  <line x1="238" y1="${startY + lines.length * 56 - 6}" x2="362" y2="${
    startY + lines.length * 56 - 6
  }" stroke="${accent}" stroke-opacity=".75"/>
  <text x="300" y="${startY + lines.length * 56 + 31}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12.5" letter-spacing="2.5" fill="#f8f3e8" fill-opacity=".85">${escapeHtml(
    book.author.toUpperCase(),
  )}</text>
  <text x="300" y="814" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12" font-style="italic" fill="#f8f3e8" fill-opacity=".72">${escapeHtml(
    book.subtitle[book.language] ?? book.subtitle.fr,
  )}</text>
  <text x="300" y="847" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7.4" letter-spacing="1.8" fill="#f8f3e8" fill-opacity=".48">${coverLabels[book.language] ?? coverLabels.fr} · ${book.year}</text>
  <rect width="600" height="900" filter="url(#grain)" opacity=".7"/>
</svg>`;
}

async function makeCoverPng(browser, slug, svg) {
  const pngPath = join(buildDir, `${slug}.png`);
  const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
  const encoded = Buffer.from(svg).toString("base64");
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#000}img{display:block;width:600px;height:900px}</style><img src="data:image/svg+xml;base64,${encoded}" alt="">`,
    { waitUntil: "networkidle" },
  );
  await page.screenshot({ path: pngPath, type: "png" });
  await page.close();
  return pngPath;
}

function isPageNoise(line) {
  const value = cleanSpaces(line);
  return (
    !value ||
    /^Digit(ized|izod|rtized)/i.test(value) ||
    /^Goog(le|k|c)/i.test(value) ||
    /^\d{1,4}$/.test(value) ||
    /^(?:[•*.,;:'’\-—=+_~|\\/]+)$/.test(value) ||
    /^(?:PREMI[ÈE]RE|DEUXI[ÈE]ME|TROISI[ÈE]ME)\s+PARTIE\b.*CHAP/i.test(value) ||
    /^(?:LIVRE|CHAPITRE)\b.*CHAP\./i.test(value)
  );
}

function isAllCaps(value) {
  const letters = value.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return letters.length >= 6 && letters.replace(/[a-zà-ÿ]/g, "").length / letters.length > 0.72;
}

function extractChapterTitle(lines, headingIndex) {
  const collected = [];
  let contentStart = headingIndex + 1;
  for (
    let cursor = headingIndex + 1;
    cursor < Math.min(headingIndex + 16, lines.length);
    cursor += 1
  ) {
    const raw = cleanSpaces(lines[cursor]);
    if (isPageNoise(raw)) {
      contentStart = cursor + 1;
      if (collected.length) break;
      continue;
    }
    if (/^CHAPITRE\b/i.test(raw)) break;
    if (collected.length === 0 && raw.length < 3) {
      contentStart = cursor + 1;
      continue;
    }
    if (collected.length === 0 && !/^[A-ZÀ-Ý«"']/.test(raw)) break;
    if (raw.length > 115) break;
    if (collected.length > 0 && !isAllCaps(raw)) break;
    collected.push(raw);
    contentStart = cursor + 1;
    if (collected.length >= 2) break;
  }
  if (collected.length === 0) return { title: "", contentStart: headingIndex + 1 };
  return { title: collected.join(" "), contentStart };
}

function cleanParagraphs(lines, start, end) {
  const paragraphs = [];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    let text = group.join(" ");
    text = text
      .replace(/\s+/g, " ")
      .replace(/(\p{L})-\s+(\p{Ll})/gu, "$1$2")
      .replace(/\s+([,.;:!?»])/g, "$1")
      .replace(/([«])\s+/g, "$1 ")
      .trim();
    if (text.length >= 2 && /[\p{L}\p{N}]/u.test(text)) {
      if (isAllCaps(text) && text.length < 90) {
        paragraphs.push({ type: "heading", text });
      } else {
        paragraphs.push({ type: "paragraph", text });
      }
    }
    group = [];
  };
  for (let index = start; index < end; index += 1) {
    const raw = lines[index] ?? "";
    const value = cleanSpaces(raw);
    if (!value) {
      flush();
      continue;
    }
    if (isPageNoise(value)) continue;
    if (/^CHAPITRE\b/i.test(value)) continue;
    if (/^TABLE\s+DES\s+MA/i.test(value)) break;
    if (/^(?:LIVRE|PARTIE)\b/i.test(value) && value.length < 60) {
      flush();
      paragraphs.push({ type: "heading", text: value });
      continue;
    }
    group.push(value);
  }
  flush();
  return paragraphs;
}

function renderParagraphs(paragraphs) {
  return paragraphs
    .map((item) =>
      item.type === "heading"
        ? `<h3>${escapeHtml(item.text)}</h3>`
        : `<p>${escapeHtml(item.text)}</p>`,
    )
    .join("\n");
}

function buildOcrChapters(config) {
  const lines = readFileSync(join(rawDir, config.rawFile), "utf8").split(/\r?\n/);
  const chapterLines = config.chapters;
  const firstChapter = chapterLines[0];
  let introStart = config.introStart - 1;
  const introMarker = lines.findIndex(
    (line, index) =>
      index >= introStart && /^(?:PRÉFACE|PREFACE|INTRODUCTION)\b/i.test(line.trim()),
  );
  if (introMarker !== -1) introStart = introMarker;

  const chapters = [
    {
      title: "Introduction",
      content: renderParagraphs(cleanParagraphs(lines, introStart, firstChapter - 1)),
      beforeToc: false,
    },
  ];

  chapterLines.forEach((lineNumber, index) => {
    const headingIndex = lineNumber - 1;
    const { title, contentStart } = extractChapterTitle(lines, headingIndex);
    const end = index + 1 < chapterLines.length ? chapterLines[index + 1] - 1 : config.end;
    const part = (config.parts ?? []).filter((item) => lineNumber >= item.start).at(-1)?.label;
    const cleanTitle = config.chapterTitles?.[index] ?? title ?? `Chapitre ${index + 1}`;
    chapters.push({
      title: part
        ? `${part} · ${cleanTitle}`
        : /^chapitre/i.test(cleanTitle)
          ? cleanTitle
          : `Chapitre ${index + 1} — ${cleanTitle}`,
      content: renderParagraphs(cleanParagraphs(lines, contentStart, end)),
    });
  });

  return chapters.filter((chapter) => chapter.content.length > 30);
}

function buildWikisourceChapters(_book, config) {
  const html = readFileSync(join(rawDir, config.rawFile), "utf8");
  const dom = new JSDOM(html);
  const document = dom.window.document;
  document
    .querySelectorAll(
      ".ws-noexport, .navbox, .toc, style, script, .mw-editsection, sup.reference, .pagenum, .ws-pagenum",
    )
    .forEach((node) => node.remove());
  const rootNode = document.querySelector(".mw-parser-output");
  const walker = document.createTreeWalker(rootNode, dom.window.NodeFilter.SHOW_ELEMENT);
  const sections = [];
  let current = null;
  let part = "";
  while (walker.nextNode()) {
    const element = walker.currentNode;
    const tag = element.tagName.toLowerCase();
    if (tag === "h2") {
      const text = cleanSpaces(element.textContent);
      if (/^LIVRE/i.test(text)) {
        part = text;
        current = null;
        continue;
      }
      part = /^PROLÉGOMÈNES/i.test(text) ? "" : text;
      current = { title: text, paragraphs: [] };
      sections.push(current);
    } else if (tag === "h3") {
      const title = cleanSpaces(element.textContent);
      current = {
        title: part ? `${part} — ${title}` : `Introduction — ${title}`,
        paragraphs: [],
      };
      sections.push(current);
    } else if (tag === "h4") {
      if (current) {
        const text = cleanSpaces(element.textContent);
        if (text) current.paragraphs.push({ type: "heading", text });
      }
    } else if (["p", "li", "blockquote"].includes(tag)) {
      if (!current) continue;
      const text = cleanSpaces(element.textContent);
      if (text.length > 2 && !/^\d+$/.test(text)) {
        current.paragraphs.push({ type: "paragraph", text });
      }
    }
  }
  return sections
    .filter((section) => section.paragraphs.length > 0)
    .map((section) => ({
      title: section.title,
      content: renderParagraphs(section.paragraphs),
    }));
}

function editorialNote(book, config, language) {
  const source = book.source;
  const text =
    language === "fr"
      ? `<p><strong>Note sur cette édition numérique</strong></p><p>Cette édition a été produite par Lumen à partir de ${escapeHtml(
          config.editionNote,
        )}, mis à disposition par ${escapeHtml(
          source.provider,
        )}. L’œuvre est dans le domaine public. Les erreurs d’OCR peuvent subsister.</p><p>Source : <a href="${escapeHtml(
          source.url,
        )}">${escapeHtml(source.url)}</a></p><p>Licence : ${escapeHtml(source.license)}.</p>`
      : `<p><strong>Note on this digital edition</strong></p><p>This edition was produced by Lumen from ${escapeHtml(
          config.editionNote,
        )}, made available by ${escapeHtml(
          source.provider,
        )}. The work is in the public domain. OCR errors may remain.</p><p>Source: <a href="${escapeHtml(
          source.url,
        )}">${escapeHtml(source.url)}</a></p><p>Licence: ${escapeHtml(source.license)}.</p>`;
  return {
    title: language === "fr" ? "Note sur cette édition" : "Note on this edition",
    content: text,
    beforeToc: true,
  };
}

async function generateEpub(book, config, chapters, coverPng) {
  const language = book.language;
  const note = editorialNote(book, config, language);
  const options = {
    title: book.title[language],
    author: book.author,
    publisher: `Lumen · ${book.source.provider}`,
    description: book.description[language],
    cover: pathToFileURL(coverPng).href,
    lang: language === "fr" ? "fr" : "en",
    date: String(book.year),
    tocTitle: language === "fr" ? "Sommaire" : "Contents",
    numberChaptersInTOC: false,
    prependChapterTitles: true,
    version: 3,
    css: `
      body { font-family: Georgia, "Times New Roman", serif; line-height: 1.7; color: #26322e; padding: 0 6%; }
      h1, h2, h3 { color: #173f35; line-height: 1.25; }
      p { text-align: justify; hyphens: auto; margin: 0 0 1em; }
      a { color: #8a6b37; }
      .note { font-family: sans-serif; font-size: .85em; }
    `,
  };
  const result = await epub(options, [note, ...chapters], 3);
  return Buffer.from(result);
}

async function readTocFromEpub(buffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) return [];
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const opf = await zip.file(opfPath)?.async("string");
  if (!opf) return [];
  const opfDom = new JSDOM(opf, { contentType: "application/xml" });
  const items = [...opfDom.window.document.getElementsByTagName("item")];
  const navItem = items.find((item) => item.getAttribute("properties")?.includes("nav"));
  const ncxItem = items.find(
    (item) => item.getAttribute("media-type") === "application/x-dtbncx+xml",
  );
  // Prefer the NCX top-level entries. Gutenberg's EPUB3 nav documents expose
  // hundreds of page-level anchors, which are too noisy for the site's TOC.
  if (ncxItem) {
    const ncxHref = ncxItem.getAttribute("href");
    const ncx = ncxHref ? await zip.file(`${base}${ncxHref}`)?.async("string") : undefined;
    if (ncx) {
      const dom = new JSDOM(ncx, { contentType: "application/xml" });
      const navMap = dom.window.document.getElementsByTagName("navMap")[0];
      if (navMap) {
        return [...navMap.children]
          .filter((node) => node.tagName === "navPoint")
          .map((node) => {
            const label = node.getElementsByTagName("navLabel")[0];
            return cleanSpaces(label?.textContent ?? "");
          })
          .filter(Boolean);
      }
    }
  }

  const tocHref = navItem?.getAttribute("href");
  if (!tocHref) return [];
  const toc = await zip.file(`${base}${tocHref}`)?.async("string");
  if (!toc) return [];
  const dom = new JSDOM(toc);
  return [...dom.window.document.getElementsByTagName("a")]
    .map((node) => cleanSpaces(node.textContent))
    .filter(Boolean);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  const manifest = {};
  const toc = {};
  const browser = await chromium.launch();
  try {
    for (const book of books) {
      const config = editions[book.slug];
      if (!config) throw new Error(`Missing edition config for ${book.slug}`);
      const svg = coverSvg(book);
      writeFileSync(join(coverDir, `${book.slug}.svg`), svg);
      console.log(`[cover] ${book.slug}.svg`);

      if (config.strategy === "copy-epub") {
        if (!hasRaw(config.sourceEpub)) {
          throw new Error(`Missing ${config.sourceEpub}. Run npm run sources:fetch.`);
        }
        const sourcePath = join(rawDir, config.sourceEpub);
        const bytes = readFileSync(sourcePath);
        copyFileSync(sourcePath, join(bookDir, `${book.slug}.epub`));
        const chapters = (await readTocFromEpub(bytes)) || [];
        toc[book.slug] = chapters;
        manifest[book.slug] = {
          file: `public/books/${book.slug}.epub`,
          sha256: sha256(bytes),
          bytes: bytes.length,
          language: book.language,
          chapters: chapters.length,
          strategy: config.strategy,
        };
        console.log(`[edition] ${book.slug}.epub ← Project Gutenberg`);
        continue;
      }

      const coverPng = await makeCoverPng(browser, book.slug, svg);
      const chapters =
        config.strategy === "wikisource"
          ? buildWikisourceChapters(book, config)
          : buildOcrChapters(config);
      const buffer = await generateEpub(book, config, chapters, coverPng);
      writeFileSync(join(bookDir, `${book.slug}.epub`), buffer);
      toc[book.slug] = chapters.map((chapter) => chapter.title);
      manifest[book.slug] = {
        file: `public/books/${book.slug}.epub`,
        sha256: sha256(buffer),
        bytes: buffer.length,
        language: book.language,
        chapters: chapters.length,
        strategy: config.strategy,
      };
      console.log(`[edition] ${book.slug}.epub ← ${config.strategy} (${chapters.length} sections)`);
    }

    const instruction = books.find((book) => book.formats.includes("pdf"));
    if (instruction) {
      const config = editions[instruction.slug];
      const sourcePdf = join(rawDir, config.pdfSource);
      if (!hasRaw(config.pdfSource)) {
        throw new Error(`Missing ${config.pdfSource}. Run npm run sources:fetch.`);
      }
      const pdfTarget = join(bookDir, `${instruction.slug}.pdf`);
      copyFileSync(sourcePdf, pdfTarget);
      const bytes = readFileSync(pdfTarget);
      manifest[instruction.slug].pdf = {
        file: `public/books/${instruction.slug}.pdf`,
        sha256: sha256(bytes),
        bytes: bytes.length,
      };
      console.log(`[pdf] ${instruction.slug}.pdf`);
    }

    writeFileSync(join(root, "content", "toc.json"), `${JSON.stringify(toc, null, 2)}\n`);
    writeFileSync(
      join(root, "content", "editions.lock.json"),
      `${JSON.stringify(
        { capturedAt: "2026-10-21", generatedAt: "2026-10-21", editions: manifest },
        null,
        2,
      )}\n`,
    );
    console.log(`[build] ${books.length} public-domain editions ready`);
  } finally {
    await browser.close();
  }
}

await main();
