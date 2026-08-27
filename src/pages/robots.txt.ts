import type { APIRoute } from "astro";
import { SITE } from "../consts";

// Endpoint em vez de arquivo em public/ porque a URL do sitemap precisa do
// domínio real, que vem de SITE_URL.
//
// Não há `Disallow` de /api/ aqui, diferente do hub e do site de seguro: este
// site não tem endpoint nenhum. Escrever uma regra para um caminho que não
// existe é instrução morta que alguém vai copiar adiante achando que precisa.
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL(SITE.url)).origin;
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${base}/sitemap-index.xml
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  );
};
