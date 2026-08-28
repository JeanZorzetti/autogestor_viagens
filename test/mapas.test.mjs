/* A gravura é a única parte da direção cujo dado NÃO mora em conteudo.ts: ele
 * mora em três arquivos gerados. O risco que estes testes cobrem é um só e é
 * silencioso — alguém mexe na lista de destinos, não roda `npm run mapas`, e
 * a pá renderiza `background-image: var(--mapa-, none)`: declaração inválida
 * que some sem erro, deixando a peça lisa. Nada na tela grita. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const conteudo = readFileSync("src/data/conteudo.ts", "utf8");
const mapasTs = readFileSync("src/data/mapas.ts", "utf8");
const mapasCss = readFileSync("src/styles/mapas.css", "utf8");

/** As quatro listas, lidas da MESMA forma que o gerador as lê. */
const porProduto = new Map(
  [...conteudo.matchAll(/codigo:\s*"(AER|HTL|PCT|CAR)"[\s\S]*?destinos:\s*\[([\s\S]*?)\]/g)].map((m) => [
    m[1],
    [...m[2].matchAll(/"([^"]+)"/g)].map((d) => d[1]),
  ]),
);

const destinos = [...new Set([...porProduto.values()].flat())];

test("as quatro listas de destino foram lidas", () => {
  assert.equal(porProduto.size, 4);
  assert.ok(destinos.length >= 19, `só ${destinos.length} destinos distintos`);
});

test("todo destino tem um contorno em mapas.ts e o custom property existe em mapas.css", () => {
  for (const d of destinos) {
    const linha = mapasTs.match(new RegExp(`"${d.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}":\\s*"(--mapa-[a-z0-9-]+)"`));
    assert.ok(linha, `${d} não tem entrada em src/data/mapas.ts — rode \`npm run mapas\``);
    assert.ok(mapasCss.includes(`${linha[1]}:`), `${linha[1]} não existe em src/styles/mapas.css`);
  }
});

test("nenhum contorno sobrando: mapas.ts não guarda destino que saiu da placa", () => {
  const declarados = [...mapasTs.matchAll(/"([^"]+)":\s*"--mapa-/g)].map((m) => m[1]);
  for (const d of declarados) {
    assert.ok(destinos.includes(d), `${d} está em mapas.ts e não está em nenhuma lista de conteudo.ts`);
  }
});

test("cada portão tem a parede da própria cobertura, e a capa tem a do saguão", () => {
  assert.ok(existsSync("public/img/parede.svg"), "falta a parede da capa");
  for (const codigo of porProduto.keys()) {
    assert.ok(existsSync(`public/img/parede-${codigo.toLowerCase()}.svg`), `falta public/img/parede-${codigo.toLowerCase()}.svg`);
  }
});

/* G9 aplicado à figura: contorno é fato geográfico, e fato geográfico vem de
   fonte primária. Um path desenhado à mão passaria por todos os testes acima
   e seria exatamente o defeito que esta direção existe para não cometer. */
test("as figuras saem de fonte primária declarada, não de desenho", () => {
  const gerador = readFileSync("logos/gerar-mapas.mjs", "utf8");
  assert.match(gerador, /world-atlas@2\/countries-50m\.json/);
  assert.match(gerador, /servicodados\.ibge\.gov\.br\/api\/v3\/malhas/);
  for (const arquivo of ["src/styles/mapas.css", "src/data/mapas.ts", "public/img/parede.svg"]) {
    assert.match(readFileSync(arquivo, "utf8"), /GERADO por logos\/gerar-mapas\.mjs/);
  }
});

/* A pá NÃO pode perder o corpo se a figura faltar. `background-image` com uma
   custom property vazia invalida a declaração inteira; o `, none` é o que
   impede que um destino sem mapa apague também o degradê das duas metades. */
test("a gravura é camada de mistura sobre o corpo da pá, com fallback", () => {
  const css = readFileSync("src/styles/global.css", "utf8");
  assert.match(css, /background-image: var\(--mapa, none\), linear-gradient\(to bottom, var\(--pa-cima\)/);
  assert.match(css, /background-blend-mode: soft-light, normal;/);
});
