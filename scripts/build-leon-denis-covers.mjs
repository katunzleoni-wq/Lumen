import { writeFileSync } from "node:fs";
import { join } from "node:path";

const coverDir = "public/covers";

function wrapTitle(text, max = 16) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > max && current) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

function cover({ title, subtitle, author, footer, accent }) {
  const lines = wrapTitle(title);
  const start = 440 - (lines.length - 1) * 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900" role="img" aria-label="Capa de ${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#151d2c"/><stop offset=".55" stop-color="${accent}"/><stop offset="1" stop-color="#151d2c"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect x="25" y="25" width="550" height="850" fill="none" stroke="#f7f1e3" stroke-opacity=".22"/>
  <text x="300" y="86" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="7" fill="#f7f1e3" fill-opacity=".85">LUMEN</text>
  <text x="300" y="108" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="7" letter-spacing="2" fill="#f7f1e3" fill-opacity=".55">BIBLIOTECA DIGITAL ESPÍRITA INTERNACIONAL</text>
  <g fill="none" stroke="#d8bd83" stroke-width="1.1" opacity=".5">
    <circle cx="300" cy="285" r="132"/><circle cx="300" cy="285" r="190" opacity=".4"/>
    <path d="M120 285h360M300 110v350" opacity=".25"/>
  </g>
  ${lines
    .map(
      (line, index) =>
        `<text x="300" y="${start + index * 52}" text-anchor="middle" font-family="Georgia, serif" font-size="38" fill="#f7f1e3">${line}</text>`,
    )
    .join("")}
  <line x1="238" y1="${start + lines.length * 52 - 4}" x2="362" y2="${start + lines.length * 52 - 4}" stroke="#d8bd83"/>
  <text x="300" y="${start + lines.length * 52 + 30}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="2.6" fill="#f7f1e3" fill-opacity=".9">${author}</text>
  <text x="300" y="742" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#f7f1e3" fill-opacity=".8">${subtitle}</text>
  <text x="300" y="802" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="8" letter-spacing="1.2" fill="#f7f1e3" fill-opacity=".6">${footer}</text>
</svg>`;
}

const works = [
  {
    slug: "depois-da-morte",
    title: "Depois da Morte",
    subtitle: "Exposição da doutrina dos Espíritos",
    author: "LÉON DENIS",
    footer: "EDIÇÃO FEB · PORTUGUÊS · USO AUTORIZADO",
    accent: "#3f4f6b",
  },
  {
    slug: "apres-la-mort",
    title: "Après la mort",
    subtitle: "Exposé de la doctrine des Esprits",
    author: "LÉON DENIS",
    footer: "ÉDITION DE 1922 · FRANÇAIS · DOMAINE PUBLIC",
    accent: "#5a4b3f",
  },
  {
    slug: "no-invisivel",
    title: "No Invisível",
    subtitle: "Espiritismo e mediunidade",
    author: "LÉON DENIS",
    footer: "EDIÇÃO FEB · PORTUGUÊS · USO AUTORIZADO",
    accent: "#2f4858",
  },
  {
    slug: "dans-l-invisible",
    title: "Dans l’invisible",
    subtitle: "Spiritisme et médiumnité",
    author: "LÉON DENIS",
    footer: "ÉDITION 1911 · FRANÇAIS · DOMAINE PUBLIC",
    accent: "#53415c",
  },
  {
    slug: "o-grande-enigma",
    title: "O Grande Enigma",
    subtitle: "Deus e o Universo",
    author: "LÉON DENIS",
    footer: "EDIÇÃO FEB · PORTUGUÊS · USO AUTORIZADO",
    accent: "#4b3a24",
  },
  {
    slug: "la-grande-enigme",
    title: "La Grande Énigme",
    subtitle: "Dieu et l’Univers",
    author: "LÉON DENIS",
    footer: "ÉDITION 1911 · FRANÇAIS · DOMAINE PUBLIC",
    accent: "#3b3f2a",
  },
];

for (const work of works) {
  writeFileSync(join(coverDir, `${work.slug}.svg`), cover(work));
  console.log(`[cover] ${work.slug}.svg`);
}
