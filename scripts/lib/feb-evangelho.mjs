import { readFileSync } from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const clean = (value) => value.replace(/\s+/g, " ").trim();
const compact = (value) => value.replace(/\s+/g, "").toUpperCase();

function linesFromPage(content) {
  const items = content.items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => ({
      text: clean(item.str),
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
        text: clean(line.items.map((item) => item.text).join(" ")),
        x: Math.min(...line.items.map((item) => item.x)),
      };
    })
    .filter((line) => line.text.length > 0);
}

function isAllCaps(value) {
  const letters = value.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return letters.length > 2 && letters.replace(/[a-zà-ÿ]/g, "").length / letters.length > 0.7;
}

function chapterNumber(line) {
  const match = compact(line).match(/^CAP[IÍ]TULO([IVXLCDM]+)\.?$/i);
  return match?.[1] ?? null;
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

function isSkippable(line, shortTitle, chapter) {
  if (/^\d{1,4}$/.test(line)) return true;
  if (/^Sem\s+t\S*\s*-\s*\d+/i.test(line)) return true;
  if (/13\/04\/05/.test(line)) return true;
  if (/^\d{2}\/\d{2}\/\d{2},/.test(line)) return true;
  if (compact(line) === "OEVANGELHOSEGUNDOOESPIRITISMO") return true;
  if (shortTitle && compact(line) === compact(shortTitle)) return true;
  if (chapter && compact(line) === compact(`CAPÍTULO ${chapter}`)) return true;
  return false;
}

export async function extractEvangelhoChapters({ sourcePath, startPage, standardFontDataUrl }) {
  const document = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(sourcePath)),
    useWorkerFetch: false,
    isEvalSupported: false,
    standardFontDataUrl,
  }).promise;

  const chapters = [];
  let current = {
    title: "Explicação",
    shortTitle: "EXPLICAÇÃO",
    blocks: [],
    para: null,
  };
  chapters.push(current);
  let currentChapterNumber = null;

  const flush = () => {
    if (current.para) {
      current.blocks.push({ type: "p", text: current.para });
      current.para = null;
    }
  };
  const startChapter = (number, title) => {
    flush();
    currentChapterNumber = number;
    const heading = number ? `Capítulo ${number}${title ? ` — ${title}` : ""}` : title;
    current = {
      title: heading,
      shortTitle: title || heading,
      blocks: [],
      para: null,
    };
    chapters.push(current);
  };

  for (let pageNumber = startPage; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = linesFromPage(content);
    const bodyBase = Math.min(...lines.filter((line) => line.x >= 140).map((line) => line.x), 156);
    let previousX = null;
    let previousText = "";

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (isSkippable(line.text, current.shortTitle, currentChapterNumber)) continue;

      if (
        (compact(line.text) === "EXPLICAÇÃO" && current.title !== "Explicação") ||
        (compact(line.text) === "PREFÁCIO" && current.title !== "Prefácio") ||
        (compact(line.text) === "INTRODUÇÃO" && current.title !== "Introdução")
      ) {
        startChapter(
          null,
          line.text
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^./, (letter) => letter.toUpperCase()),
        );
        continue;
      }

      const number = chapterNumber(line.text);
      if (number) {
        const nextNumber = currentChapterNumber ? romanToInt(currentChapterNumber) + 1 : 1;
        if (currentChapterNumber === null || romanToInt(number) === nextNumber) {
          const titleParts = [];
          for (let cursor = index + 1; cursor < Math.min(index + 4, lines.length); cursor += 1) {
            const next = lines[cursor];
            if (next.x < 140 || next.text.length > 120) break;
            if (isSkippable(next.text, "", "")) break;
            titleParts.push(next.text);
            index = cursor;
          }
          startChapter(number, titleParts.join(" ").trim());
        }
        continue;
      }

      if (
        line.x > 140 &&
        line.text.length < 120 &&
        (isAllCaps(line.text) || /^[IVXLCDM]+\s*[–-]/.test(line.text))
      ) {
        flush();
        current.blocks.push({ type: "h3", text: line.text });
        continue;
      }

      const numbered = /^\d+\./.test(line.text) || /^[IVXLCDM]+\.\s/.test(line.text);
      const indented = line.x >= bodyBase + 8;
      const startsNew =
        !current.para ||
        numbered ||
        (indented &&
          (previousX === null || line.x >= previousX + 8 || previousX <= bodyBase + 6)) ||
        (line.x <= bodyBase + 6 &&
          previousX !== null &&
          previousX <= bodyBase + 6 &&
          /[.!?…”"]$/.test(previousText) &&
          /^[A-ZÀ-Ý0-9“"]/.test(line.text));

      if (startsNew) {
        flush();
        current.para = line.text;
      } else {
        if (current.para?.endsWith("-") && /^[a-zà-ÿ]/.test(line.text)) {
          current.para = `${current.para.slice(0, -1)}${line.text}`;
        } else {
          current.para = current.para ? `${current.para} ${line.text}` : line.text;
        }
      }
      previousX = line.x;
      previousText = line.text;
    }
  }
  flush();

  return chapters
    .map((chapter) => ({
      ...chapter,
      blocks: chapter.blocks.filter((block) => block.text.length > 1),
    }))
    .filter((chapter) => chapter.blocks.length > 0);
}
