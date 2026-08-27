// A conta da placa. É o único teste do repositório, e existe porque é a única
// lógica daqui que quebra EM SILÊNCIO: o ciclo das pás está espalhado entre
// três tokens em tokens.css, uma lista em conteudo.ts e uma tabela de
// porcentagens no keyframe `ciclo` em global.css. Mexer num sem refazer os
// outros não quebra build, não quebra tipo e não suja o console — só faz a
// placa piscar em branco ou repetir destino, e ninguém olha o CSS de novo.
//
// `node --test test/*.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const global_ = readFileSync("src/styles/global.css", "utf8");
const conteudo = readFileSync("src/data/conteudo.ts", "utf8");

const seg = (nome) => {
  const m = tokens.match(new RegExp(`--${nome}:\\s*([\\d.]+)s`));
  assert.ok(m, `token --${nome} não existe em tokens.css`);
  return Number(m[1]);
};

const parada = seg("pa-parada");
const giro = seg("pa-giro");
const total = seg("pa-total");

const destinos = conteudo
  .match(/export const DESTINOS = \[([\s\S]*?)\] as const;/)?.[1]
  .match(/"[^"]+"/g);
assert.ok(destinos, "não achei DESTINOS em src/data/conteudo.ts");

test("o ciclo dura exatamente uma parada por destino", () => {
  // Se sobrar tempo, a placa fica parada no último destino antes de reiniciar;
  // se faltar, dois destinos se atropelam.
  assert.equal(total, +(parada * destinos.length).toFixed(6), `${destinos.length} destinos × ${parada}s ≠ ${total}s`);
});

test("cada pá ocupa 1/N do ciclo no keyframe", () => {
  const fatia = 100 / destinos.length;
  // O `hold` termina no fim do slot da pá (12.5% com 8 destinos) e a saída
  // vaza um giro além dele, sobrepondo a entrada da pá seguinte. Se a saída
  // couber DENTRO do slot, sobra uma janela com a placa vazia.
  const fim = Number(global_.match(/\n  1%,\n  ([\d.]+)% \{/)?.[1]);
  assert.equal(fim, fatia, `o hold termina em ${fim}%, deveria terminar em ${fatia}%`);

  const saida = Number(global_.match(/\n  ([\d.]+)% \{\n    transform: rotateX\(92deg\)/)?.[1]);
  const giroEmPorcento = (giro / total) * 100;
  assert.equal(
    +(saida - fim).toFixed(4),
    +giroEmPorcento.toFixed(4),
    `a saída leva ${(saida - fim).toFixed(2)}% e um giro é ${giroEmPorcento.toFixed(2)}% do ciclo`
  );
  assert.ok(saida > fatia, "a saída precisa vazar além do slot, senão a placa pisca em branco");
});

test("existe uma pá para cada destino, e a marcação numera todas", () => {
  const index = readFileSync("src/pages/index.astro", "utf8");
  assert.match(index, /DESTINOS\.map\(\(d, i\) =>/, "a placa precisa gerar as pás da lista, não à mão");
  assert.match(index, /--i:\$\{i\}/, "cada pá precisa carregar seu índice para o atraso do ciclo");
});

/** Tira comentários de bloco e de linha inteira. O teste abaixo precisa olhar
 *  o que é SERVIDO, não o que é explicado — os próprios comentários deste
 *  repositório citam a tarifa de exemplo que eles proíbem. `//` só conta no
 *  começo da linha, senão a regra comeria o `https://` de qualquer URL. */
const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("nenhum preço em lugar nenhum do conteúdo servido", () => {
  // A regra que manda no conteudo.ts: tarifa vive na busca e muda por rota e
  // por data. Um valor de enfeite na primeira tela é número inventado — e é o
  // defeito que este site declarou não cometer, inclusive no llms.txt.
  for (const arquivo of ["src/data/conteudo.ts", "src/pages/index.astro", "src/pages/sobre.astro"]) {
    const achado = semComentario(readFileSync(arquivo, "utf8")).match(/R\$\s?\d/);
    assert.equal(achado, null, `${arquivo} exibe um preço (${achado?.[0]}); tarifa só na busca`);
  }
});

test("todo CTA aponta para a busca, e a busca mora numa constante só", () => {
  const consts = readFileSync("src/consts.ts", "utf8");
  assert.match(consts, /busca: "https:\/\/br\.onertravel\.com\//, "a URL da busca saiu de consts.ts");
  const index = readFileSync("src/pages/index.astro", "utf8");
  assert.equal(index.match(/onertravel/gi), null, "URL da busca escrita à mão na página; use EXTERNOS.busca");
});
