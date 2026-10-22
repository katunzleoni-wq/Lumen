/**
 * Generates the reproducible demo editions and covers.
 *
 * The catalogue ships short, editorially prepared sample editions (EPUB 3 and
 * PDF) so that both readers can be exercised offline. Replace the files and the
 * `content/books.json` entries to plug a full catalogue in production.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const books = JSON.parse(readFileSync(join(root, "content", "books.json"), "utf8")).books;
const samples = JSON.parse(readFileSync(join(root, "content", "samples.json"), "utf8"));

const coverDir = join(root, "public", "covers");
const bookDir = join(root, "public", "books");
mkdirSync(coverDir, { recursive: true });
mkdirSync(bookDir, { recursive: true });

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const wrapWords = (text, maxChars) => {
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
};

function motifSvg(motif, accent) {
  const a = escapeXml(accent);
  switch (motif) {
    case "orbit":
      return `
        <g fill="none" stroke="${a}" stroke-width="1.1" opacity=".8">
          <ellipse cx="300" cy="290" rx="210" ry="92" transform="rotate(-24 300 290)"/>
          <ellipse cx="300" cy="290" rx="168" ry="168" opacity=".5"/>
          <circle cx="434" cy="196" r="5" fill="${a}" stroke="none"/>
          <circle cx="167" cy="363" r="3.5" fill="${a}" stroke="none"/>
        </g>
        <circle cx="300" cy="290" r="62" fill="${a}" opacity=".12"/>
        <circle cx="300" cy="290" r="31" fill="${a}" opacity=".24"/>`;
    case "arches":
      return `
        <g fill="none" stroke="${a}" stroke-width="1.5" opacity=".7">
          <path d="M120 520V320a180 180 0 0 1 360 0v200"/>
          <path d="M155 520V328a145 145 0 0 1 290 0v192" opacity=".72"/>
          <path d="M190 520V336a110 110 0 0 1 220 0v184" opacity=".5"/>
          <path d="M225 520V344a75 75 0 0 1 150 0v176" opacity=".34"/>
        </g>
        <circle cx="300" cy="300" r="17" fill="${a}" opacity=".55"/>`;
    case "constellation":
      return `
        <g stroke="${a}" stroke-width="1" opacity=".55">
          <path d="M148 392l52-77 74 28 46-92 78 61 66-40"/>
          <path d="M200 315l24 89 50-62 74 105 42-129"/>
        </g>
        <g fill="${a}">
          <circle cx="148" cy="392" r="3"/><circle cx="200" cy="315" r="5"/>
          <circle cx="252" cy="343" r="2.6"/><circle cx="320" cy="251" r="4"/>
          <circle cx="398" cy="312" r="2.8"/><circle cx="464" cy="272" r="3.6"/>
          <circle cx="274" cy="404" r="2.4"/><circle cx="348" cy="509" r="3.4"/>
          <circle cx="390" cy="380" r="2.2"/>
        </g>
        <circle cx="300" cy="290" r="120" fill="none" stroke="${a}" stroke-width=".6" opacity=".35"/>`;
    case "moon":
      return `
        <circle cx="300" cy="292" r="106" fill="${a}" opacity=".14"/>
        <path d="M346 201a104 104 0 1 0 55 155 86 86 0 0 1-55-155z" fill="${a}" opacity=".48"/>
        <g fill="${a}" opacity=".6">
          <circle cx="184" cy="176" r="2"/><circle cx="412" cy="153" r="2.8"/>
          <circle cx="448" cy="345" r="1.8"/><circle cx="153" cy="401" r="2.4"/>
          <circle cx="378" cy="451" r="2"/>
        </g>`;
    case "seed":
      return `
        <g fill="none" stroke="${a}" stroke-width="1.2" opacity=".7">
          <path d="M300 500V250"/>
          <path d="M300 354c-76 0-118-44-118-111 76 0 118 44 118 111z"/>
          <path d="M300 412c76 0 118-44 118-111-76 0-118 44-118 111z"/>
          <path d="M300 270c-34-24-47-57-35-100 35 17 52 48 35 100z"/>
        </g>
        <circle cx="300" cy="500" r="8" fill="${a}" opacity=".55"/>
        <circle cx="300" cy="286" r="150" fill="none" stroke="${a}" stroke-width=".7" opacity=".3"/>`;
    case "rays":
      return `
        <g stroke="${a}" stroke-width="1.2" opacity=".55">
          ${Array.from({ length: 17 }, (_, index) => {
            const angle = (-90 + index * 11.25) * (Math.PI / 180);
            const x1 = 300 + Math.cos(angle) * 66;
            const y1 = 310 + Math.sin(angle) * 66;
            const x2 = 300 + Math.cos(angle) * 205;
            const y2 = 310 + Math.sin(angle) * 205;
            return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(
              1,
            )}" y2="${y2.toFixed(1)}"/>`;
          }).join("")}
        </g>
        <circle cx="300" cy="310" r="48" fill="${a}" opacity=".22"/>
        <circle cx="300" cy="310" r="24" fill="none" stroke="${a}" stroke-width="1.2"/>`;
    case "waves":
      return `
        <g fill="none" stroke="${a}" stroke-width="1.2" opacity=".62">
          <path d="M-20 292c70-54 142-54 212 0s142 54 212 0 142-54 212 0"/>
          <path d="M-20 340c70-54 142-54 212 0s142 54 212 0 142-54 212 0" opacity=".72"/>
          <path d="M-20 388c70-54 142-54 212 0s142 54 212 0 142-54 212 0" opacity=".48"/>
          <path d="M-20 436c70-54 142-54 212 0s142 54 212 0 142-54 212 0" opacity=".28"/>
        </g>
        <circle cx="300" cy="247" r="41" fill="${a}" opacity=".18"/>`;
    default:
      return `
        <g stroke="${a}" stroke-width=".7" opacity=".35">
          ${Array.from(
            { length: 13 },
            (_, i) => `<line x1="90" y1="${175 + i * 24}" x2="510" y2="${175 + i * 24}"/>`,
          ).join("")}
          ${Array.from(
            { length: 10 },
            (_, i) => `<line x1="${120 + i * 40}" y1="150" x2="${120 + i * 40}" y2="500"/>`,
          ).join("")}
        </g>
        <rect x="235" y="255" width="130" height="130" fill="${a}" opacity=".12"/>
        <rect x="264" y="284" width="72" height="72" fill="none" stroke="${a}" stroke-width="1.4"/>`;
  }
}

function coverSvg(book) {
  const [base, mid, accent] = book.palette;
  const lines = wrapWords(book.title.pt, 19);
  const startY = 470 - (lines.length - 1) * 28;
  const titleLines = lines
    .map(
      (line, index) =>
        `<text x="300" y="${startY + index * 58}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" letter-spacing="-.6" fill="#f8f3e8">${escapeXml(
          line,
        )}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-label="Capa de ${escapeXml(
    book.title.pt,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/>
      <stop offset=".58" stop-color="${mid}"/>
      <stop offset="1" stop-color="${base}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".34" r=".58">
      <stop offset="0" stop-color="${accent}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".055"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect width="600" height="900" fill="url(#glow)"/>
  <rect x="24" y="24" width="552" height="852" fill="none" stroke="#f8f3e8" stroke-opacity=".22"/>
  <text x="300" y="83" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="7" fill="#f8f3e8" fill-opacity=".82">LUMEN</text>
  <text x="300" y="106" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7.6" letter-spacing="2.4" fill="#f8f3e8" fill-opacity=".56">BIBLIOTECA DIGITAL ESPÍRITA INTERNACIONAL</text>
  ${motifSvg(book.motif, accent)}
  ${titleLines}
  <line x1="238" y1="${startY + lines.length * 58 - 4}" x2="362" y2="${
    startY + lines.length * 58 - 4
  }" stroke="${accent}" stroke-opacity=".75"/>
  <text x="300" y="${startY + lines.length * 58 + 34}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="2.6" fill="#f8f3e8" fill-opacity=".84">${escapeXml(
    book.author.toUpperCase(),
  )}</text>
  <text x="300" y="812" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12" font-style="italic" fill="#f8f3e8" fill-opacity=".68">${escapeXml(
    book.subtitle.pt,
  )}</text>
  <text x="300" y="846" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7.5" letter-spacing="2" fill="#f8f3e8" fill-opacity=".46">AMOSTRA EDITORIAL · ${book.year}</text>
  <rect width="600" height="900" filter="url(#grain)" opacity=".7"/>
</svg>`;
}

function uuidFor(slug) {
  const hex = createHash("sha1").update(`lumen:${slug}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(
    17,
    20,
  )}-${hex.slice(20, 32)}`;
}

const chapterXhtml = (chapter, index) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR" xml:lang="pt-BR">
<head><title>${escapeXml(chapter.title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <section epub:type="chapter" class="chapter">
    <p class="eyebrow">CAPÍTULO ${index + 1}</p>
    <h1>${escapeXml(chapter.title)}</h1>
    ${chapter.paragraphs.map((paragraph) => `<p>${escapeXml(paragraph)}</p>`).join("\n    ")}
  </section>
</body>
</html>`;

async function generateEpub(book, sample) {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );

  const navItems = sample.chapters
    .map(
      (chapter, index) =>
        `<li><a href="chapter-${index + 1}.xhtml">${escapeXml(chapter.title)}</a></li>`,
    )
    .join("\n      ");

  zip.file(
    "OEBPS/style.css",
    `@charset "utf-8";
@namespace epub "http://www.idpf.org/2007/ops";
:root { color-scheme: light; }
html { font-size: 100%; }
body { margin: 0; padding: 0; color: #26322e; background: #fbf8f0; font-family: Georgia, "Times New Roman", serif; line-height: 1.72; }
.chapter { padding: 7% 9%; max-width: 38rem; margin: 0 auto; }
.eyebrow { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: .66rem; letter-spacing: .22em; color: #8a6b37; margin: 0 0 1.2rem; }
h1 { font-size: 1.72rem; line-height: 1.25; font-weight: 500; color: #173f35; margin: 0 0 1.8rem; }
p { margin: 0 0 1.15em; text-align: justify; hyphens: auto; }
.titlepage { min-height: 82vh; display: flex; flex-direction: column; justify-content: center; padding: 9%; }
.titlepage .brand { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; letter-spacing: .28em; font-size: .66rem; color: #8a6b37; margin-bottom: 2.4rem; }
.titlepage h1 { font-size: 2.45rem; }
.titlepage .author { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: .82rem; letter-spacing: .14em; color: #52615b; text-transform: uppercase; }
.titlepage .note { margin-top: 3rem; font-size: .9rem; color: #5e6a64; font-style: italic; }
.cover { margin: 0; padding: 0; text-align: center; height: 100vh; }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.about { padding: 8%; }
.about h2 { color: #173f35; font-size: 1.35rem; }
.small { font-size: .82rem; color: #68746e; }
nav ol { padding-left: 1.1rem; }
nav a { color: #234d41; text-decoration: none; }`,
  );

  zip.file(
    "OEBPS/cover.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR" xml:lang="pt-BR">
<head><title>Capa</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="cover"><img src="cover.svg" alt="Capa de ${escapeXml(book.title.pt)}"/></body>
</html>`,
  );
  zip.file("OEBPS/cover.svg", coverSvg(book));

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR" xml:lang="pt-BR">
<head><title>Sumário</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Sumário</h1>
    <ol>
      <li><a href="titlepage.xhtml">Sobre esta edição</a></li>
      ${navItems}
    </ol>
  </nav>
</body>
</html>`,
  );

  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:${uuidFor(book.slug)}"/></head>
  <docTitle><text>${escapeXml(book.title.pt)}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1"><navLabel><text>Sobre esta edição</text></navLabel><content src="titlepage.xhtml"/></navPoint>
    ${sample.chapters
      .map(
        (chapter, index) =>
          `<navPoint id="navpoint-${index + 2}" playOrder="${index + 2}"><navLabel><text>${escapeXml(
            chapter.title,
          )}</text></navLabel><content src="chapter-${index + 1}.xhtml"/></navPoint>`,
      )
      .join("\n    ")}
  </navMap>
</ncx>`,
  );

  zip.file(
    "OEBPS/titlepage.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR" xml:lang="pt-BR">
<head><title>${escapeXml(book.title.pt)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
  <section epub:type="titlepage" class="titlepage">
    <p class="brand">LUMEN · BIBLIOTECA DIGITAL ESPÍRITA INTERNACIONAL</p>
    <h1>${escapeXml(book.title.pt)}</h1>
    <p class="author">${escapeXml(book.author)}</p>
    <p class="note">${escapeXml(sample.label)}. Trechos selecionados para demonstrar a experiência de leitura. Esta edição não substitui o texto integral da obra.</p>
    <p class="small">Edição de amostra · ${book.year} · Língua: português</p>
  </section>
</body>
</html>`,
  );

  sample.chapters.forEach((chapter, index) => {
    zip.file(`OEBPS/chapter-${index + 1}.xhtml`, chapterXhtml(chapter, index));
  });

  const manifestChapters = sample.chapters
    .map(
      (_, index) =>
        `<item id="chapter-${index + 1}" href="chapter-${index + 1}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join("\n    ");
  const spineChapters = sample.chapters
    .map((_, index) => `<itemref idref="chapter-${index + 1}"/>`)
    .join("\n    ");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="pt-BR">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:${uuidFor(book.slug)}</dc:identifier>
    <dc:title>${escapeXml(book.title.pt)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>pt-BR</dc:language>
    <dc:publisher>Lumen — Biblioteca Digital Espírita Internacional</dc:publisher>
    <dc:description>${escapeXml(book.description.pt)}</dc:description>
    <dc:subject>Espiritismo</dc:subject>
    <dc:date>${book.year}</dc:date>
    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    <item id="cover-image" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    ${manifestChapters}
  </manifest>
  <spine toc="ncx" page-progression-direction="ltr">
    <itemref idref="cover" linear="yes"/>
    <itemref idref="titlepage"/>
    ${spineChapters}
  </spine>
</package>`,
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  writeFileSync(join(bookDir, `${book.slug}.epub`), buffer);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return rgb(
    Number.parseInt(clean.slice(0, 2), 16) / 255,
    Number.parseInt(clean.slice(2, 4), 16) / 255,
    Number.parseInt(clean.slice(4, 6), 16) / 255,
  );
}

function wrapForPdf(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function generatePdf(book, sample) {
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  const width = 420;
  const height = 595;
  const margin = 48;
  const ink = rgb(0.12, 0.17, 0.15);
  const body = rgb(0.19, 0.24, 0.22);
  const cream = rgb(0.985, 0.972, 0.941);
  const [base, mid, accent] = book.palette;
  const bg = hexToRgb(base);
  const bgMid = hexToRgb(mid);
  const gold = hexToRgb(accent);

  doc.setTitle(`${book.title.pt} — amostra editorial`);
  doc.setAuthor(book.author);
  doc.setSubject(book.description.pt);
  doc.setKeywords(["espiritismo", "Allan Kardec", "Lumen", "amostra"]);
  doc.setCreator("Lumen — Biblioteca Digital Espírita Internacional");
  doc.setProducer("Lumen build pipeline");

  const cover = doc.addPage([width, height]);
  cover.drawRectangle({ x: 0, y: 0, width, height, color: bg });
  cover.drawRectangle({ x: 0, y: 0, width, height: 300, color: bgMid, opacity: 0.34 });
  cover.drawCircle({ x: 330, y: 370, size: 44, color: gold, opacity: 0.22 });
  cover.drawCircle({ x: 330, y: 370, size: 22, color: gold, opacity: 0.55 });
  cover.drawCircle({
    x: 330,
    y: 370,
    size: 104,
    borderColor: gold,
    borderWidth: 0.8,
    opacity: 0.8,
  });
  cover.drawRectangle({
    x: 22,
    y: 22,
    width: width - 44,
    height: height - 44,
    borderColor: gold,
    borderWidth: 0.6,
    opacity: 0.4,
  });
  // Center the wordmark manually.
  const lumenWidth = sans.widthOfTextAtSize("LUMEN", 9);
  cover.drawText("LUMEN", {
    x: (width - lumenWidth) / 2,
    y: 534,
    size: 9,
    font: sans,
    color: rgb(0.97, 0.95, 0.89),
  });
  const titleLines = wrapForPdf(book.title.pt, serifBold, 27, width - 104);
  let titleY = 380 + (titleLines.length - 1) * 16;
  titleLines.forEach((line) => {
    const lineWidth = serifBold.widthOfTextAtSize(line, 27);
    cover.drawText(line, {
      x: (width - lineWidth) / 2,
      y: titleY,
      size: 27,
      font: serifBold,
      color: rgb(0.975, 0.955, 0.9),
    });
    titleY -= 33;
  });
  const authorWidth = sans.widthOfTextAtSize(book.author.toUpperCase(), 8);
  cover.drawText(book.author.toUpperCase(), {
    x: (width - authorWidth) / 2,
    y: titleY - 6,
    size: 8,
    font: sans,
    color: gold,
  });
  const subtitleWidth = serifItalic.widthOfTextAtSize(book.subtitle.pt, 9);
  cover.drawText(book.subtitle.pt, {
    x: (width - subtitleWidth) / 2,
    y: 68,
    size: 9,
    font: serifItalic,
    color: rgb(0.94, 0.91, 0.84),
    opacity: 0.8,
  });
  cover.drawText("EDIÇÃO DE AMOSTRA", {
    x: (width - sans.widthOfTextAtSize("EDIÇÃO DE AMOSTRA", 6.5)) / 2,
    y: 48,
    size: 6.5,
    font: sans,
    color: rgb(0.94, 0.91, 0.84),
    opacity: 0.6,
  });

  const addTextPage = () => {
    const page = doc.addPage([width, height]);
    page.drawRectangle({ x: 0, y: 0, width, height, color: cream });
    return page;
  };

  let page = addTextPage();
  let y = height - margin - 20;
  page.drawText("SOBRE ESTA EDIÇÃO", {
    x: margin,
    y,
    size: 7,
    font: sans,
    color: gold,
  });
  y -= 38;
  const introLines = wrapForPdf(book.title.pt, serifBold, 22, width - margin * 2);
  introLines.forEach((line) => {
    page.drawText(line, { x: margin, y, size: 22, font: serifBold, color: ink });
    y -= 27;
  });
  y -= 6;
  page.drawText(book.author, { x: margin, y, size: 10, font: serifItalic, color: body });
  y -= 30;
  const description = `${book.description.pt} ${sample.label}. Esta edição de amostra foi preparada para demonstrar a experiência de leitura da Biblioteca Lumen. O texto integral da obra, em domínio público, pode ser incorporado ao acervo sem alterações na arquitetura do leitor.`;
  for (const line of wrapForPdf(description, serif, 9.6, width - margin * 2)) {
    page.drawText(line, { x: margin, y, size: 9.6, font: serif, color: body });
    y -= 14;
  }
  page.drawText(`Língua: português · ${book.year} · ${book.pages} páginas (edição integral)`, {
    x: margin,
    y: 52,
    size: 6.8,
    font: sans,
    color: body,
    opacity: 0.65,
  });

  sample.chapters.forEach((chapter, chapterIndex) => {
    page = addTextPage();
    y = height - margin - 20;
    page.drawText(`CAPÍTULO ${chapterIndex + 1}`, {
      x: margin,
      y,
      size: 6.5,
      font: sans,
      color: gold,
    });
    y -= 30;
    const headingLines = wrapForPdf(chapter.title, serifBold, 18, width - margin * 2);
    headingLines.forEach((line) => {
      page.drawText(line, { x: margin, y, size: 18, font: serifBold, color: ink });
      y -= 23;
    });
    y -= 8;
    for (const paragraph of chapter.paragraphs) {
      const lines = wrapForPdf(paragraph, serif, 9.2, width - margin * 2);
      for (const line of lines) {
        if (y < 62) {
          page = addTextPage();
          y = height - margin;
        }
        page.drawText(line, { x: margin, y, size: 9.2, font: serif, color: body });
        y -= 13.2;
      }
      y -= 11;
    }
  });

  const pages = doc.getPages();
  pages.slice(1).forEach((item, index) => {
    item.drawText(`${index + 2}`, {
      x: width / 2 - 3,
      y: 30,
      size: 6.5,
      font: sans,
      color: body,
      opacity: 0.5,
    });
    item.drawText("LUMEN", {
      x: width - margin - 26,
      y: 30,
      size: 5.5,
      font: sans,
      color: gold,
      opacity: 0.7,
    });
  });

  const bytes = await doc.save();
  writeFileSync(join(bookDir, `${book.slug}.pdf`), bytes);
}

for (const book of books) {
  const sample = samples[book.slug];
  if (!sample) throw new Error(`Missing sample content for ${book.slug}`);
  writeFileSync(join(coverDir, `${book.slug}.svg`), coverSvg(book));
  await generateEpub(book, sample);
  await generatePdf(book, sample);
  console.log(`[assets] ${book.slug} → cover.svg, epub, pdf`);
}

console.log(`[assets] ${books.length} sample editions generated in public/books`);
