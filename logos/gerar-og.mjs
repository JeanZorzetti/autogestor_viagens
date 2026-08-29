// Gera a imagem de compartilhamento (Open Graph) do site.
//   npm run build && node logos/gerar-og.mjs
//
// ═══ ELE DEIXOU DE DESENHAR E PASSOU A FOTOGRAFAR ═══════════════════════════
// A versão anterior montava o cartão do zero num HTML próprio: a faixa de
// status, o título em monoespaçada, uma "pá" com um destino travado e as
// quatro linhas da placa. Era uma SEGUNDA versão da capa, mantida à mão.
//
// E foi exatamente assim que ela apodreceu. Quando a direção mudou, o cartão
// continuou servindo a placa Solari — mono em tudo, num site que não tem mais
// mono em título nenhum. Pior: ele exibia "DESTINO FORTALEZA", um nome de
// CIDADE que o conteúdo do site tinha banido meses antes (a regra passou a ser
// país/região, porque "a busca vende a Argentina" é fato do produto e "a busca
// vende Fortaleza" é afirmação sobre o inventário de um terceiro). O cartão
// que aparece para quem AINDA NÃO ENTROU no site estava mostrando a única
// coisa que o site combinou de não dizer.
//
// A correção não é redesenhar o cartão na direção nova — é parar de ter um
// segundo desenho. Agora o script abre a capa de verdade no navegador e
// fotografa a primeira tela. O cartão passa a ser a página: se a direção
// mudar de novo, ele muda junto, sem ninguém lembrar de nada.
//
// Ele fotografa o BUILD, nunca o dev server: o `astro dev` injeta a barra de
// ferramentas do Astro, que apareceria no cartão.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const RAIZ = ".vercel/output/static";
const SAIDA = "public/img/og.png";

const L = 1200;
const A = 630;

/* A ALTURA DA JANELA DE CAPTURA. A abertura da capa mede `92svh`, então para
   que ela preencha exatamente os 630px do cartão a viewport precisa ser
   630 ÷ 0,92 ≈ 685px de altura. Sem essa conta o cartão sairia com uma faixa
   da vitrine embaixo, ou com a abertura cortada no meio da frase. */
const VIEWPORT_A = Math.round(A / 0.92);

const T = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".json": "application/json",
};

const srv = createServer(async (q, r) => {
  const alvo = decodeURIComponent(q.url.split("?")[0]);
  for (const t of [alvo, alvo + ".html", join(alvo, "index.html")]) {
    try {
      const f = join(RAIZ, normalize(t));
      if ((await stat(f)).isDirectory()) continue;
      const b = await readFile(f);
      r.writeHead(200, { "content-type": T[extname(f)] ?? "application/octet-stream" });
      return r.end(b);
    } catch {}
  }
  r.writeHead(404);
  r.end();
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const porta = srv.address().port;

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: L, height: VIEWPORT_A }, deviceScaleFactor: 1 });
const pagina = await ctx.newPage();
await pagina.goto(`http://127.0.0.1:${porta}/`, { waitUntil: "load" });

/* `.then(() => true)`: `document.fonts.ready` resolve para um FontFaceSet, que
   não atravessa a serialização do Playwright. */
await pagina.evaluate(() => document.fonts.ready.then(() => true));
await pagina.evaluate(() =>
  Promise.all([...document.images].filter((i) => i.loading !== "lazy").map((i) => i.decode().catch(() => {}))).then(
    () => true,
  ),
);

/* A entrada da página anima a lâmina de texto subindo por uma fresta. Um
   cartão tirado no meio disso pegaria a chamada pela metade — então o script
   desliga a coreografia em vez de esperar um tempo arbitrário e torcer. É o
   mesmo estado que quem usa `prefers-reduced-motion` vê: a composição inteira,
   parada. */
await pagina.addStyleTag({
  content: `.entra > * { animation: none !important; translate: 0 0 !important; }`,
});
await pagina.waitForTimeout(400);

await pagina.screenshot({ path: SAIDA, clip: { x: 0, y: 0, width: L, height: A } });

/* A prova de que o cartão não saiu escuro por acidente (imagem que não chegou,
   véu com o valor errado): a luminância média tem que estar numa faixa de
   fotografia à hora azul, nem preta nem estourada. Um cartão preto é o defeito
   mais provável aqui e o mais difícil de notar — ninguém abre o PNG. */
const { data, info } = await import("sharp").then((m) =>
  m.default(SAIDA).raw().toBuffer({ resolveWithObject: true }),
);
let soma = 0;
for (let i = 0; i < data.length; i += info.channels) soma += (data[i] + data[i + 1] + data[i + 2]) / 3;
const media = soma / (data.length / info.channels);
if (media < 12 || media > 200) {
  throw new Error(`og.png com luminância média ${media.toFixed(1)}/255 — o cartão provavelmente saiu em branco ou preto`);
}

console.log(`${SAIDA} — ${L}×${A}, luminância média ${media.toFixed(1)}/255 (a primeira tela da capa)`);

await nav.close();
srv.close();
