// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

// SITE_URL inválida (vazia, sem esquema, colada de um .env com comentário na
// mesma linha) não pode derrubar o build — mas também não pode passar em
// silêncio, senão o canonical sai apontando para o domínio de preview e
// ninguém percebe até o site sumir da busca.
const bruto = process.env.SITE_URL;
const site = bruto && URL.canParse(bruto) ? bruto : "https://viagens.roilabs.com.br";
if (bruto && bruto !== site) console.warn(`[viagens] SITE_URL inválida (${bruto}); usando ${site}`);

export default defineConfig({
  site,
  // Estático inteiro. Diferente do hub e do site de seguro, aqui não existe
  // NENHUM endpoint dinâmico: a vertical é self-service, a compra acontece na
  // busca da OnerTravel, e por isso não há formulário de lead, não há
  // `/api/lead` e não há `pg` no package.json. Sem banco, sem função
  // serverless, sem cold start.
  output: "static",
  adapter: vercel(),
  integrations: [sitemap()],
  trailingSlash: "never",
  build: { inlineStylesheets: "always" },
  image: { responsiveStyles: true },
});
