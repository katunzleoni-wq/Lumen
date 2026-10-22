import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumen — Biblioteca Digital Espírita Internacional",
    short_name: "Lumen",
    description: "Obras espíritas em domínio público, leitura em EPUB e PDF, em quatro idiomas.",
    start_url: "/pt",
    display: "standalone",
    background_color: "#f8f4ea",
    theme_color: "#10231d",
    lang: "pt-BR",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
