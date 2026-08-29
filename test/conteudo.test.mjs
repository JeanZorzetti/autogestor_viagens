// As invariantes de CONTEÚDO do site: o que ele promete, para onde ele manda,
// e o que ele nunca pode servir. Existem porque são as coisas que quebram EM
// SILÊNCIO — não derrubam build, não derrubam tipo, não sujam o console.
//
// ═══ ESTE ARQUIVO ENCOLHEU EM 28/08/2026 ══════════════════════════════════
// Ele era `placa.test.mjs` e metade dele media a coreografia da direção
// Solari: o ciclo das pás espalhado entre tokens, quatro listas de destino e
// quatro tabelas de porcentagem em CSS. Aquilo tudo saiu com a direção. Os
// testes que ficaram são os que nunca foram sobre a placa — eram sobre o
// PRODUTO, e o produto não mudou.
//
// A superfície de risco da direção nova é outra e mora em fotos.test.mjs.
//
// `node --test test/*.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ler = (caminho) => readFileSync(caminho, "utf8");

/** Casa `export const PRODUTOS = [...] as const;` com ou sem anotação de tipo
 *  (`: readonly Produto[]`) entre o nome e o `=`. */
const RE_PRODUTOS = /export const PRODUTOS(?:\s*:[^=]+)?\s*=\s*\[([\s\S]*?)\]\s*as const;/;

/** Tira comentários de um fonte .ts/.astro antes de procurar padrão proibido.
 *  Sem isto, um comentário que EXPLICA por que o site não exibe preço (e que
 *  precisa citar "R$ 1.284" para explicar) faz o teste do preço reprovar — o
 *  que já aconteceu neste repositório. O que o teste guarda é o que é
 *  SERVIDO, e comentário não é servido. */
const semComentario = (fonte) =>
  fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/^\s*\/\/.*$/gm, "");

test("nenhum preço em lugar nenhum do conteúdo servido", () => {
  // A regra que manda no conteudo.ts: tarifa vive na busca e muda por rota e
  // por data. Um valor de enfeite na primeira tela seria número inventado — e
  // é o defeito que este site declarou não cometer, inclusive no llms.txt.
  const arquivos = [
    "src/data/conteudo.ts",
    "src/pages/index.astro",
    "src/pages/sobre.astro",
    "src/pages/passagens-aereas.astro",
    "src/pages/hoteis.astro",
    "src/pages/pacotes.astro",
    "src/pages/aluguel-de-carro.astro",
  ].filter(existsSync);
  for (const arquivo of arquivos) {
    const achado = semComentario(ler(arquivo)).match(/R\$\s?\d/);
    assert.equal(achado, null, `${arquivo} exibe um preço (${achado?.[0]}); tarifa só na busca`);
  }
});

test("V6 — nenhum preço, hora de voo ou número de voo no BUILD servido (FR-029, FR-030)", { skip: !existsSync("dist") ? "rode `npm run build` antes: V6 lê o dist, não a fonte" : false }, () => {
  const glob = (dir) => {
    let arquivos = [];
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      arquivos = statSync(p).isDirectory() ? [...arquivos, ...glob(p)] : p.endsWith(".html") ? [...arquivos, p] : arquivos;
    }
    return arquivos;
  };
  for (const arquivo of glob("dist")) {
    // O JSON-LD legitimamente tem HH:MM — é o horário de atendimento
    // (`openingHoursSpecification`), não hora de voo. O que este teste guarda
    // é o CONTEÚDO VISÍVEL do painel, então o grafo estruturado sai antes de
    // procurar o padrão de hora de voo.
    const html = ler(arquivo).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
    assert.doesNotMatch(html, /R\$\s?\d/, `${arquivo} serve um preço`);
    assert.doesNotMatch(html, /\b([01]\d|2[0-3]):[0-5]\d\b/, `${arquivo} serve algo no formato HH:MM (hora de voo)`);
    assert.doesNotMatch(html, /\b[A-Z]{2}\s?\d{3,4}\b/, `${arquivo} pode estar servindo número de voo`);
  }
});

test("V7 — todo CTA externo aponta para EXTERNOS.busca, e nenhuma URL de resultado vazio aparece (R1)", () => {
  const consts = ler("src/consts.ts");
  assert.match(consts, /busca: "https:\/\/br\.onertravel\.com\//, "a URL da busca saiu de consts.ts");

  const astros = [];
  const varrer = (dir) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) varrer(p);
      else if (p.endsWith(".astro")) astros.push(p);
    }
  };
  varrer("src/pages");
  varrer("src/components");
  varrer("src/layouts");

  // A MARCA "OnerTravel" pode aparecer em prosa (é o que /sobre, /termos e o
  // rodapé fazem, de propósito — FR-023). O que não pode é o DOMÍNIO escrito à
  // mão: isso seria uma segunda fonte da verdade para a URL de busca.
  const proibidas = /onertravel\.com|flight-list|hotel-list|car-list|combined/i;
  for (const arquivo of astros) {
    const conteudo = semComentario(ler(arquivo));
    assert.doesNotMatch(conteudo, proibidas, `${arquivo}: URL/rota da OnerTravel escrita à mão; use EXTERNOS.busca`);
  }
});

test("V8 — quatro rotas, quatro slugs únicos, sem colisão (FR-015)", () => {
  const conteudo = ler("src/data/conteudo.ts");
  const bloco = conteudo.match(RE_PRODUTOS)?.[1] ?? "";
  const rotas = [...bloco.matchAll(/rota:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(rotas.length, 4, "os quatro produtos precisam declarar `rota`");
  assert.equal(new Set(rotas).size, 4, `slug repetido: ${rotas.join(", ")}`);
  for (const r of rotas) {
    assert.match(r, /^\/[a-z0-9-]+$/, `"${r}" não é um slug válido (minúsculas, hífen, barra inicial, sem barra final)`);
  }

  if (existsSync("dist/sitemap-0.xml")) {
    const sitemap = ler("dist/sitemap-0.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.equal(urls.length, 8, `sitemap tem ${urls.length} URLs, deveria ter 8`);
    assert.ok(!urls.some((u) => u.includes("/404")), "/404 não pode entrar no sitemap");
  }
});
