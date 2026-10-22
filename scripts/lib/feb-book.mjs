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
        y: line.y,
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

export async function extractBookChapters({
  sourcePath,
  startPage,
  standardFontDataUrl,
  initialTitle = "",
  runningHeader,
  bodyMinX = 140,
  titleMinX = 140,
  parts = {},
}) {
  const document = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(sourcePath)),
    useWorkerFetch: false,
    isEvalSupported: false,
    standardFontDataUrl,
  }).promise;

  const chapters = [];
  let current = {
    title: initialTitle,
    shortTitle: initialTitle,
    part: "",
    blocks: [],
    para: null,
  };
  if (initialTitle) chapters.push(current);
  let currentChapterNumber = null;
  let currentPart = "";

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
      title: currentPart ? `${currentPart} — ${heading}` : heading,
      shortTitle: title || heading,
      part: currentPart,
      blocks: [],
      para: null,
    };
    chapters.push(current);
  };

  for (let pageNumber = startPage; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = linesFromPage(content);
    const bodyBase = Math.min(
      ...lines.filter((line) => line.x >= bodyMinX).map((line) => line.x),
      156,
    );
    let previousX = null;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^\d{1,4}$/.test(line.text)) continue;
      if (/^\d{1,4}\s*[–-]\s*/.test(line.text)) continue;
      if (/^Sem\s+t\S*\s*-\s*\d+/i.test(line.text)) continue;
      if (/13\/04\/05/.test(line.text)) continue;
      if (/Allan\s+Kar/i.test(line.text)) continue;
      if (compact(line.text) === compact(runningHeader ?? "")) continue;
      if (current.shortTitle && compact(line.text) === compact(current.shortTitle)) continue;
      if (
        currentChapterNumber &&
        compact(line.text) === compact(`CAPÍTULO ${currentChapterNumber}`)
      ) {
        continue;
      }

      const partMatch = compact(line.text).match(/^(PRIMEIRA|SEGUNDA|TERCEIRA)PARTE$/);
      if (partMatch && parts[partMatch[1]]) {
        const subtitleParts = [];
        let previousY = line.y;
        for (let cursor = index + 1; cursor < Math.min(index + 3, lines.length); cursor += 1) {
          const next = lines[cursor];
          if (Math.abs(next.y - previousY) > 42) break;
          if (next.x < titleMinX || next.text.length > 100) break;
          if (isAllCaps(next.text)) break;
          subtitleParts.push(next.text);
          previousY = next.y;
          index = cursor;
        }
        currentPart = `${parts[partMatch[1]]}${
          subtitleParts.length ? ` — ${subtitleParts.join(" ")}` : ""
        }`;
        currentChapterNumber = null;
        continue;
      }

      const number = chapterNumber(line.text);
      if (number) {
        const nextNumber = currentChapterNumber ? romanToInt(currentChapterNumber) + 1 : 1;
        if (currentChapterNumber === null || romanToInt(number) === nextNumber) {
          const titleParts = [];
          let previousY = line.y;
          const maxCursor = Math.min(index + 3, lines.length);
          for (let cursor = index + 1; cursor < maxCursor; cursor += 1) {
            const next = lines[cursor];
            if (Math.abs(next.y - previousY) > 60) break;
            if (next.x < titleMinX || next.text.length > 130) break;
            if (/^\d+\./.test(next.text) || /^\d+$/.test(next.text)) break;
            if (/^[•∑]/.test(next.text)) break;
            titleParts.push(next.text);
            previousY = next.y;
            index = cursor;
          }
          startChapter(number, titleParts.join(" ").trim());
        }
        continue;
      }

      if (
        line.x >= titleMinX &&
        line.text.length < 110 &&
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
        (indented && (previousX === null || line.x >= previousX + 8 || previousX <= bodyBase + 6));

      if (startsNew) {
        flush();
        current.para = line.text;
      } else if (current.para?.endsWith("-") && /^[a-zà-ÿ]/.test(line.text)) {
        current.para = `${current.para.slice(0, -1)}${line.text}`;
      } else {
        current.para = current.para ? `${current.para} ${line.text}` : line.text;
      }
      previousX = line.x;
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
