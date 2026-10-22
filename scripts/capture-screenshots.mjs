/**
 * Captures the documentation screenshots from a running production build.
 * Usage: PLAYWRIGHT_BASE_URL=http://localhost:3200 npm run screenshots
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3200";
const output = join(root, "docs", "screenshots");
mkdirSync(output, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});
const page = await context.newPage();

async function settle() {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

async function screenshot(name, url, options = {}) {
  await page.setViewportSize(options.viewport ?? { width: 1440, height: 1000 });
  await page.goto(`${baseURL}${url}`, { waitUntil: "networkidle" });
  await settle();
  if (options.selector) {
    await page.locator(options.selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
  }
  if (options.before) await options.before(page);
  await page.screenshot({
    path: join(output, `${name}.jpg`),
    type: "jpeg",
    quality: 88,
    fullPage: options.fullPage ?? false,
  });
  console.log(`[screenshot] ${name}.jpg`);
}

await screenshot("home", "/pt");
await screenshot("library", "/pt/biblioteca");
await screenshot("book", "/pt/livro/o-livro-dos-espiritos", {
  viewport: { width: 1440, height: 1180 },
});
await screenshot("about", "/pt/sobre", {
  viewport: { width: 1440, height: 1120 },
  selector: "#autores",
});
await screenshot("search", "/pt/busca?q=caridade", {
  before: async (target) => {
    await target.waitForTimeout(2_000);
  },
});
await screenshot("reader", "/pt/ler/o-livro-dos-espiritos", {
  before: async (target) => {
    const frame = target.frameLocator("iframe");
    await frame.locator("body").waitFor({ timeout: 30_000 });
    await target.getByRole("button", { name: "Próxima" }).click();
    await target.waitForTimeout(1_000);
  },
});
await screenshot("home-mobile", "/pt", {
  viewport: { width: 390, height: 844 },
});

await browser.close();
