import { cpSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pdfjs = join(root, "node_modules", "pdfjs-dist");
const worker = join(pdfjs, "build", "pdf.worker.min.mjs");
const destination = join(root, "public", "pdf.worker.min.mjs");

if (!existsSync(worker)) {
  console.warn("[pdfjs] worker not found; run npm install first.");
  process.exit(0);
}

mkdirSync(join(root, "public"), { recursive: true });
copyFileSync(worker, destination);
console.log("[pdfjs] worker copied to public/pdf.worker.min.mjs");

const standardFonts = join(pdfjs, "standard_fonts");
if (existsSync(standardFonts)) {
  cpSync(standardFonts, join(root, "public", "pdfjs", "standard_fonts"), { recursive: true });
  console.log("[pdfjs] standard fonts copied to public/pdfjs/standard_fonts");
}
