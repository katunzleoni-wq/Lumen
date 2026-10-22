/**
 * Generates the 1200×630 social preview image using the same visual language
 * as the application. Run: node scripts/generate-og.mjs
 */
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const cover = readFileSync("public/covers/o-livro-dos-espiritos.svg");
const coverData = `data:image/svg+xml;base64,${cover.toString("base64")}`;

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; }
  body {
    position: relative;
    overflow: hidden;
    background: #10231d;
    color: #f8f3e8;
    font-family: "Segoe UI", Helvetica, Arial, sans-serif;
  }
  .glow-a {
    position: absolute; width: 760px; height: 760px; border-radius: 50%;
    right: -170px; top: -310px;
    background: radial-gradient(circle, rgba(207,168,91,.34), transparent 65%);
  }
  .glow-b {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    left: -300px; bottom: -430px;
    background: radial-gradient(circle, rgba(80,141,116,.35), transparent 68%);
  }
  .frame {
    position: absolute; inset: 28px; border: 1px solid rgba(248,243,232,.16);
  }
  .ring-a {
    position: absolute; width: 510px; height: 510px; border-radius: 50%;
    right: 30px; top: 64px; border: 1px solid rgba(207,168,91,.22);
  }
  .ring-b {
    position: absolute; width: 390px; height: 390px; border-radius: 50%;
    right: 92px; top: 124px; border: 1px solid rgba(248,243,232,.10);
  }
  .content {
    position: absolute; inset: 0; padding: 62px 72px;
    display: grid; grid-template-columns: 1fr 360px; gap: 20px;
  }
  .brand { display: flex; align-items: center; gap: 13px; }
  .mark {
    width: 42px; height: 42px; border-radius: 50%;
    border: 1px solid rgba(248,243,232,.22);
    background: rgba(248,243,232,.06);
    display: grid; place-items: center;
  }
  .mark svg { width: 25px; height: 25px; }
  .wordmark { font-family: Georgia, "Times New Roman", serif; font-size: 27px; letter-spacing: -.4px; }
  .brand small {
    display: block; margin-top: 4px; font-size: 8px; font-weight: 600;
    letter-spacing: 2.2px; text-transform: uppercase; color: rgba(248,243,232,.5);
  }
  .eyebrow {
    margin-top: 76px; display: flex; align-items: center; gap: 12px;
    font-size: 10px; font-weight: 600; letter-spacing: 2.4px;
    text-transform: uppercase; color: #d8b473;
  }
  .eyebrow span { width: 34px; height: 1px; background: #c8a45f; }
  h1 {
    margin: 22px 0 0; max-width: 620px;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 400; font-size: 64px; line-height: .98; letter-spacing: -2.8px;
  }
  h1 em { display: block; color: #d8b473; font-weight: 400; }
  .support {
    margin-top: 25px; max-width: 520px; font-size: 15px; line-height: 1.55;
    color: rgba(248,243,232,.62);
  }
  .meta {
    position: absolute; left: 72px; bottom: 57px;
    display: flex; align-items: center; gap: 20px;
    font-size: 10px; font-weight: 600; letter-spacing: 1.8px;
    text-transform: uppercase; color: rgba(248,243,232,.5);
  }
  .meta i { width: 3px; height: 3px; border-radius: 50%; background: #c8a45f; }
  .book-wrap {
    position: relative; display: flex; align-items: center; justify-content: center;
    padding-top: 20px;
  }
  .book {
    width: 254px; height: 381px; border-radius: 3px 8px 8px 3px;
    overflow: hidden; transform: rotate(4deg);
    box-shadow: 0 38px 70px -28px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.14);
  }
  .book img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .note {
    position: absolute; bottom: 20px; right: 4px; width: 230px;
    padding: 13px 16px; border-radius: 10px;
    background: rgba(16,35,29,.82); border: 1px solid rgba(207,168,91,.28);
    backdrop-filter: blur(6px);
  }
  .note strong { display: block; font-size: 9px; letter-spacing: 1.8px; text-transform: uppercase; color: #d8b473; }
  .note span { display: block; margin-top: 5px; font-family: Georgia, serif; font-size: 14px; color: rgba(248,243,232,.85); }
  .grain {
    position: absolute; inset: 0; opacity: .14; mix-blend-mode: soft-light;
    background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.35) 1px, transparent 0);
    background-size: 5px 5px;
  }
</style>
</head>
<body>
  <div class="glow-a"></div>
  <div class="glow-b"></div>
  <div class="ring-a"></div>
  <div class="ring-b"></div>
  <div class="frame"></div>
  <div class="grain"></div>
  <div class="content">
    <div>
      <div class="brand">
        <span class="mark">
          <svg viewBox="0 0 36 36" fill="none">
            <path d="M6 9.5c4.9-2.7 9.8-1.2 12 2 2.2-3.2 7.1-4.7 12-2V27c-4.9-2.2-9.8-.8-12 2.4C15.8 26.2 10.9 24.8 6 27V9.5Z" stroke="#f8f3e8" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M18 11.5v18" stroke="#f8f3e8" stroke-width="1.1" opacity=".65"/>
            <circle cx="18" cy="4.5" r="1.5" fill="#d8b473"/>
          </svg>
        </span>
        <span class="wordmark">Lumen<small>Biblioteca espírita</small></span>
      </div>
      <div class="eyebrow"><span></span>Biblioteca Digital Espírita Internacional</div>
      <h1>Leia com tempo.<em>Pense com liberdade.</em></h1>
      <p class="support">Obras fundamentais em domínio público, curadoria editorial e leitura em quatro idiomas.</p>
      <div class="meta"><span>8 obras</span><i></i><span>4 idiomas</span><i></i><span>EPUB + PDF</span></div>
    </div>
    <div class="book-wrap">
      <div class="book"><img src="${coverData}" alt="" /></div>
      <div class="note"><strong>Comece por aqui</strong><span>O Livro dos Espíritos</span></div>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({
  path: "public/og.jpg",
  type: "jpeg",
  quality: 90,
  animations: "disabled",
});
await browser.close();
console.log("[og] public/og.jpg generated");
