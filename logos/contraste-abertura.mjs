/* PROVA DA ABERTURA — o gate da decisão central desta direção.
 *
 *   npm run build && node logos/contraste-abertura.mjs
 *   (sai com código 1 se algum par reprovar)
 *
 * ═══ POR QUE ESTE SCRIPT EXISTE ═══════════════════════════════════════════
 * logos/contraste.mjs mede pares de TOKEN contra TOKEN, e isso cobre o site
 * inteiro menos o lugar que mais importa: a abertura, onde o texto pousa sobre
 * uma fotografia. Ali o fundo não é um token — são pixels, diferentes em cada
 * uma das cinco rotas, e que mudam quando alguém troca uma foto, mexe no
 * `object-position`, ou ajusta um dos valores de --vidro-*.
 *
 * A direção anterior resolvia isso proibindo: a foto entrava a 11% de
 * opacidade e um script provava que NENHUM texto cruzava a faixa fotográfica.
 * Esta direção faz o oposto — o título mora sobre a imagem, em cor cheia — e
 * então a invariante também tem que ser o oposto: não "não há texto sobre a
 * foto", e sim "todo texto sobre a foto passa o piso da WCAG contra o pixel
 * mais desfavorável que existe embaixo dele".
 *
 * ═══ O QUE ELE COBRE ══════════════════════════════════════════════════════
 * TODA fotografia da página — a da abertura e as quatro peças da vitrine — em
 * DOIS estados. O estado de hover entra porque a camada de ponteiro da direção
 * recua o véu da peça e cresce a imagem por baixo da legenda: o pior fundo que
 * aquele texto vê na vida é o de hover, não o de repouso.
 *
 * ═══ COMO ELE MEDE ════════════════════════════════════════════════════════
 * Estimar o alfa do véu e fazer a conta daria um número que não é o da tela:
 * entre a fotografia e o olho ainda passam o gradiente do véu, o grão em
 * `soft-light` e a compressão do AVIF. Então o script não estima nada.
 *
 *   1. Rola a página inteira, para que as peças `loading="lazy"` sejam de fato
 *      pedidas e decodificadas — sem isso o que se mediria é a cor de poster.
 *   2. Mapeia a caixa de cada linha de texto que cruza alguma fotografia,
 *      junto com a cor computada e o tamanho de fonte daquele texto.
 *   3. Descarta o texto que tem superfície OPACA entre ele e a foto (o rótulo
 *      dentro do botão laranja, por exemplo) — o par de contraste dele é com
 *      aquela superfície, e quem mede isso é o contraste.mjs.
 *   4. Esconde o texto com `visibility: hidden` — que preserva a geometria —
 *      e fotografa a página. O que fica no lugar de cada caixa é exatamente o
 *      fundo composto que o olho vê ali.
 *   5. Varre cada caixa pixel a pixel e acha o mais claro E o mais escuro.
 *   6. Mede o texto contra os dois e reprova pelo pior.
 *
 * O piso é o da WCAG 1.4.3: 4.5:1 para texto normal, 3:1 para texto grande
 * (≥ 24px, ou ≥ 18.66px em peso 700+). */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import sharp from "sharp";

const RAIZ = ".vercel/output/static";
/* PORTA EFÊMERA (0 = o SO escolhe uma livre), e não um número escrito à mão.
   Uma porta fixa colide com uma execução anterior que ficou pendurada e o
   script morre em EADDRINUSE — que foi exatamente o que aconteceu na primeira
   vez que ele rodou. O verificar.mjs tem um comentário longo sobre a mesma
   armadilha; aqui a saída é não ter número nenhum para conflitar. */
let PORTA = 0;

/* As cinco rotas que abrem com fotografia. As de documento (/sobre, /termos,
   /privacidade, /404) não têm abertura e não entram aqui — texto sobre token
   é trabalho do contraste.mjs. */
const ROTAS = ["/", "/passagens-aereas", "/hoteis", "/pacotes", "/aluguel-de-carro"];

/* As mesmas larguras do logos/verificar.mjs. A estreita importa mais do que
   parece: quanto mais estreita a tela, mais alta fica a coluna de texto, e
   mais alto o título sobe dentro do véu — o par pior quase sempre aparece em
   360, não em 1920. */
const LARGURAS = [
  [360, 780],
  [736, 1024],
  [1440, 900],
  [1920, 1080],
];

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
PORTA = srv.address().port;

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const nav = await chromium.launch();
let falhas = 0;
let medidos = 0;

for (const rota of ROTAS) {
  for (const [w, h] of LARGURAS) {
  /* Dois estados por rota. "hover" não é um caso de borda: a camada de
     ponteiro da direção RECUA o véu da peça (opacidade 0.55) e cresce a
     imagem por baixo da legenda — ou seja, o pior fundo que aquele texto vê
     na vida é o do estado de hover, não o de repouso. Medir só o repouso é
     medir o caso fácil.
     O estado é forçado por CSS e não por `pg.hover()`, que só alcança uma
     peça de cada vez: o que interessa é o estado final, e ele é declarado. */
  for (const estado of ["repouso", "hover"]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORTA}${rota}`, { waitUntil: "load" });
    /* `.then(() => true)` porque `document.fonts.ready` resolve para um
       FontFaceSet, que não atravessa a fronteira de serialização do
       Playwright. */
    await pg.evaluate(() => document.fonts.ready.then(() => true));
    /* A fotografia precisa estar DECODIFICADA, não só baixada: o que
       fotografamos é o pixel final, e um <img> ainda não pintado devolveria a
       cor de poster — que é mais escura que a foto e faria o gate passar por
       um motivo falso.

       SÓ AS NÃO-LAZY, e a filtragem não é otimização: `decode()` numa imagem
       `loading="lazy"` que está fora da viewport NUNCA RESOLVE — o navegador
       ainda não pediu o arquivo, e a promessa fica pendurada para sempre. A
       primeira versão deste script esperava por todas e travava em silêncio na
       primeira rota, sem imprimir uma linha. As que interessam aqui são
       justamente as `eager`: a abertura é a única fotografia que este gate
       mede. O `race` de 3s é rede de segurança para o resto.  */
    await pg.evaluate(() =>
      Promise.race([
        Promise.all(
          [...document.images]
            .filter((i) => i.loading !== "lazy")
            .map((i) => i.decode().catch(() => {})),
        ),
        new Promise((r) => setTimeout(r, 3000)),
      ]).then(() => true),
    );
    if (estado === "hover") {
      await pg.addStyleTag({
        content: `.peca .foto img { scale: 1.045 !important; } .peca__veu { opacity: .55 !important; }`,
      });
      await pg.waitForTimeout(700);
    }
    await pg.waitForTimeout(400);

    /* As peças da vitrine são `loading="lazy"` e vivem abaixo da dobra: sem
       rolar até elas, o navegador nunca pede o arquivo e o que seria medido é
       a cor de poster. Rola até o fim e volta, o que dispara todas. */
    await pg.evaluate(async () => {
      const passo = innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += passo) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      scrollTo(0, 0);
      await Promise.race([
        Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
      return true;
    });
    await pg.waitForTimeout(500);

    /* A coleta e o screenshot precisam do MESMO sistema de coordenadas: com a
       página no topo, `getBoundingClientRect()` coincide com o offset de
       documento que o `fullPage` usa. */
    await pg.evaluate(() => scrollTo(0, 0));
    await pg.waitForTimeout(200);

    const alvos = await pg.evaluate(() => {
      /* TODA fotografia da página, não só a da abertura. A primeira versão
         media só `.abertura__foto` e deixava passar o caso mais fácil de
         esquecer: a legenda das peças da vitrine, que também é texto sobre
         imagem — e que no estado de hover fica com MENOS véu por cima, porque
         a camada de ponteiro recua o véu de propósito. */
      const fotos = [...document.querySelectorAll(".foto")].map((f) => f.getBoundingClientRect());
      if (!fotos.length) return [];
      const achados = [];

      /* A COR RESOLVIDA VIA CANVAS, e não por regex no computed style.
         O Chromium NÃO normaliza oklch para rgb: `getComputedStyle().color`
         de um token OKLCH devolve `oklch(0.78 0.018 250)` literal. Ler os três
         números dali e tratá-los como R,G,B produziu 283 reprovações falsas de
         286 medições — um "vermelho" de 0.78 sobre qualquer coisa reprova.
         Pintar a cor num canvas de 1px e ler o pixel de volta faz o próprio
         navegador resolver a notação, seja ela qual for. */
      const cv = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      const resolver = (cor) => {
        cv.clearRect(0, 0, 1, 1);
        cv.fillStyle = cor;
        cv.fillRect(0, 0, 1, 1);
        return [...cv.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };

      /* Sobe a cadeia procurando um fundo sólido entre o texto e a foto. Alfa
         1 basta: uma superfície opaca no meio significa que o par de contraste
         daquele texto é com ELA, e o contraste.mjs já o mede. */
      const protegido = (el) => {
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg === "transparent" || bg === "rgba(0, 0, 0, 0)") continue;
          const alfa = bg.match(/[/,]\s*([0-9.]+)\s*\)$/);
          if (!alfa || Number(alfa[1]) === 1) return true;
        }
        return false;
      };

      const anda = (n) => {
        for (const f of n.childNodes) {
          if (f.nodeType === 3 && f.textContent.trim()) {
            const pai = f.parentElement;
            const cs = getComputedStyle(pai);
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            /* O link de pular só existe focado; medi-lo escondido mediria uma
               caixa de 1px em cima de qualquer coisa. */
            if (pai.closest(".visualmente-oculto")) continue;
            if (protegido(pai)) continue;

            /* Marca o PRÓPRIO elemento que carrega o texto, para escondê-lo
               depois. Esconder por lista de seletores de contêiner não bastou:
               o crédito da foto é texto filho direto de `.abertura__credito`, e
               `.abertura__credito *` não o alcança — o script media o texto
               contra ele mesmo e reportava 1.01:1. Marcar na coleta cobre
               qualquer estrutura, hoje e depois. */
            pai.dataset.medindo = "1";

            const rg = document.createRange();
            rg.selectNodeContents(f);
            for (const b of rg.getClientRects()) {
              if (!b.width || !b.height) continue;
              /* Só interessa o texto que REALMENTE cruza alguma fotografia. */
              const sobre = fotos.some(
                (cf) => b.top < cf.bottom && b.bottom > cf.top && b.left < cf.right && b.right > cf.left,
              );
              if (!sobre) continue;
              const px = parseFloat(cs.fontSize);
              const peso = Number(cs.fontWeight) || 400;
              achados.push({
                texto: f.textContent.trim().slice(0, 40),
                cor: resolver(cs.color),
                /* WCAG: "texto grande" é ≥ 18pt (24px), ou ≥ 14pt (18.66px)
                   quando o peso é 700 ou mais. */
                piso: px >= 24 || (px >= 18.66 && peso >= 700) ? 3 : 4.5,
                caixa: { x: b.x, y: b.y, w: b.width, h: b.height },
              });
            }
          } else if (f.nodeType === 1 && getComputedStyle(f).visibility !== "hidden") {
            anda(f);
          }
        }
      };
      anda(document.body);
      return achados;
    });

    if (!alvos.length) {
      await ctx.close();
      continue;
    }

    /* `visibility: hidden` e não `color: transparent`: o segundo mantém a
       sombra de texto, que clareia o fundo justamente onde queremos medi-lo. */
    await pg.addStyleTag({ content: `[data-medindo] { visibility: hidden !important; }` });
    await pg.waitForTimeout(120);

    /* `fullPage` e não a viewport: as peças da vitrine vivem abaixo da dobra, e
       um screenshot de viewport as deixa fora do PNG — as caixas delas caíam
       fora do retângulo medido e eram descartadas em silêncio. O sintoma era
       um total que não subia ao incluir a vitrine (552 = 276 × 2 estados, com
       zero peça medida).
       Com a página em scrollY = 0, `getBoundingClientRect()` já devolve
       coordenadas de documento, que é o sistema do PNG de página inteira.
       O grão (`position: fixed`) é pintado uma vez no topo em vez de repetir —
       ele é 4.5% em soft-light, e a diferença que isso faz num par de
       contraste está muito abaixo do primeiro decimal. */
    const png = await pg.screenshot({ type: "png", fullPage: true });
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    for (const a of alvos) {
      /* Encolhe 1px de cada lado: a borda da caixa de um Range costuma pegar
         meio pixel do vizinho, e no gradiente do véu isso vira um extremo que
         não está debaixo de letra nenhuma. */
      const x0 = Math.max(0, Math.ceil(a.caixa.x) + 1);
      const y0 = Math.max(0, Math.ceil(a.caixa.y) + 1);
      const x1 = Math.min(info.width, Math.floor(a.caixa.x + a.caixa.w) - 1);
      const y1 = Math.min(info.height, Math.floor(a.caixa.y + a.caixa.h) - 1);
      if (x1 <= x0 || y1 <= y0) continue;

      let claro = null;
      let escuro = null;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * info.width + x) * info.channels;
          const p = [data[i], data[i + 1], data[i + 2]];
          const l = lum(p);
          if (claro === null || l > lum(claro)) claro = p;
          if (escuro === null || l < lum(escuro)) escuro = p;
        }
      }
      if (!claro) continue;

      const cor = a.cor;
      const pior = Math.min(razao(cor, claro), razao(cor, escuro));
      medidos++;
      const ok = pior >= a.piso;
      if (!ok) {
        falhas++;
        const hex = (p) => "#" + p.map((v) => v.toString(16).padStart(2, "0")).join("");
        console.log(
          `  ✗ ${rota} @${w}${estado === "hover" ? " hover" : ""}  "${a.texto}"  ${pior.toFixed(2)}:1  (piso ${a.piso})  ` +
            `texto ${hex(cor)} · pior pixel ${hex(razao(cor, claro) < razao(cor, escuro) ? claro : escuro)}`,
        );
      }
    }
    process.stdout.write(`  ${rota} @${w}${estado === "hover" ? " (hover)" : ""} · ${alvos.length} caixas
`);
    await ctx.close();
  }
  }
}

await nav.close();
srv.close();

console.log(
  falhas
    ? `
${falhas} par(es) de ${medidos} reprovaram. Ajuste --vidro-* em tokens.css e rode de novo.`
    : `
${medidos} pares de texto-sobre-fotografia medidos — ${ROTAS.length} rotas × ${LARGURAS.length} larguras × 2 estados (repouso e hover). Todos passam.`,
);

process.exit(falhas ? 1 : 0);
