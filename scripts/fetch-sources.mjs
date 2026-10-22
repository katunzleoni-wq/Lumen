/**
 * Downloads the public-domain source files used to build the editions.
 * Raw files are intentionally ignored by Git; the generated EPUBs and PDF are
 * committed so a normal `npm install && npm run dev` needs no network access.
 *
 * Usage: npm run sources:fetch
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rawDir = join(root, "content-sources", "raw");
const editions = JSON.parse(readFileSync(join(root, "content", "editions.json"), "utf8"));
mkdirSync(rawDir, { recursive: true });

async function download(url, destination) {
  if (existsSync(destination) && !process.argv.includes("--force")) {
    console.log(`[skip] ${destination}`);
    return;
  }
  const response = await fetch(url, {
    headers: { "User-Agent": "Lumen-library/1.0 (content sourcing; local build)" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(destination, bytes);
  console.log(`[fetch] ${destination} (${Math.round(bytes.length / 1024)} kB)`);
}

for (const [slug, config] of Object.entries(editions)) {
  const target = join(rawDir, config.rawFile);
  if (config.strategy === "wikisource") {
    if (existsSync(target) && !process.argv.includes("--force")) {
      console.log(`[skip] ${target}`);
      continue;
    }
    const response = await fetch(config.fetchUrl, {
      headers: { "User-Agent": "Lumen-library/1.0 (content sourcing; local build)" },
    });
    if (!response.ok) throw new Error(`${config.fetchUrl} -> HTTP ${response.status}`);
    const json = await response.json();
    if (!json?.parse?.text) throw new Error(`Unexpected Wikisource response for ${slug}`);
    writeFileSync(target, json.parse.text, "utf8");
    console.log(`[fetch] ${target} (wikisource HTML)`);
  } else {
    await download(config.fetchUrl, target);
  }

  if (config.pdfSource) {
    await download(config.pdfFetchUrl, join(rawDir, config.pdfSource));
  }
}

console.log("[sources] all public-domain sources are available in content-sources/raw");
