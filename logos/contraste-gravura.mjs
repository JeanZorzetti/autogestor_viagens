/* CONTRASTE DA GRAVURA — o par que logos/contraste.mjs não consegue medir.
 *
 * Aquele script lê os TOKENS e calcula os pares em OKLCH, e é por isso que ele
 * pegou a borda do botão de contorno antes de a página existir. Mas a gravura
 * não é um token: o pixel embaixo da letra é o resultado de um
 * `background-blend-mode: soft-light` entre o contorno do lugar e o degradê da
 * pá, e esse valor só existe depois de pintado. A quina do sulco CLAREIA a
 * peça — se ela clarear demais, o laranja da pá cai abaixo de 4.5:1 e o gesto
 * principal da direção fica ilegível justamente onde ele é mais bonito.
 *
 * Método: 12 amostras ao longo de ~6s por rota (as pás viram a cada 2,2s), e
 * em cada amostra o pixel MAIS CLARO da metade de cima de cada janela — a
 * metade de cima é a que pega a luz de 200°, a de baixo é sempre mais escura.
 * Guarda o pior de todos e falha com código 1 se algum reprovar.
 *
 * Uso: npm run build && npm run contraste-gravura
 */

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const ROTAS = ["/", "/passagens-aereas", "/hoteis", "/pacotes", "/aluguel-de-carro"];
const AMOSTRAS = 12;
const INTERVALO = 500;
const MINIMO = 4.5;
const PORTA = 4415;

const TIPOS = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

const servidor = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  if (!extname(p)) p += "/index.html";
  try {
    const buf = await readFile(join("dist", p));
    res.writeHead(200, { "content-type": TIPOS[extname(p)] ?? "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404).end("404");
  }
});
await new Promise((r) => servidor.listen(PORTA, r));

const relativa = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const razao = (a, b) => {
  const [alto, baixo] = [relativa(a), relativa(b)].sort((m, n) => n - m);
  return (alto + 0.05) / (baixo + 0.05);
};

const navegador = await chromium.launch();
const leitor = await navegador.newPage();
let reprovados = 0;
let medidos = 0;

for (const rota of ROTAS) {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pagina.goto(`http://localhost:${PORTA}${rota}`, { waitUntil: "networkidle" });

  /* A cor computada volta em `oklch(...)` no Chromium moderno — um
     `match(/\d+/g)` leria "0, 797, 0". O canvas resolve para sRGB, que é o
     espaço em que a fórmula da WCAG vive. */
  const texto = await pagina.evaluate(() => {
    const cor = getComputedStyle(document.querySelector(".coluna-destino__pa")).color;
    const c = document.createElement("canvas").getContext("2d");
    c.fillStyle = cor;
    c.fillRect(0, 0, 1, 1);
    return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3);
  });

  /* O TEXTO SAI DA MEDIÇÃO. Primeira versão filtrava o laranja por cor e
     media 3,35:1 nas oito janelas — mas o pixel culpado era rgb(110,90,71),
     o antialiasing da própria letra, não a superfície embaixo dela. Excluir
     por faixa de cor não funciona: a suavização é um degradê contínuo entre
     o fundo e o texto, e sempre sobra um passo dentro de qualquer faixa.
     Apagar a tinta e medir a peça é a única leitura que não mente. */
  await pagina.addStyleTag({ content: ".coluna-destino__pa { color: transparent !important; }" });

  const caixas = await pagina.evaluate(() =>
    [...document.querySelectorAll(".coluna-destino__janela")].map((j) => {
      const r = j.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }),
  );

  const pior = caixas.map(() => ({ lum: -1, px: null, rotulo: "" }));

  for (let a = 0; a < AMOSTRAS; a++) {
    // textContent continua legível com `color: transparent` — é o DOM, não a tinta.
    const rotulos = await pagina.evaluate(() =>
      [...document.querySelectorAll(".coluna-destino__janela")].map(
        (j) =>
          [...j.querySelectorAll(".coluna-destino__pa")]
            .map((p) => ({ p, o: Number(getComputedStyle(p).opacity) }))
            .sort((x, y) => y.o - x.o)[0].p.textContent.trim(),
      ),
    );
    const png = await pagina.screenshot();
    await leitor.setContent(`<img id="i" src="data:image/png;base64,${png.toString("base64")}">`);
    await leitor.waitForFunction(() => document.getElementById("i").complete);
    const achados = await leitor.evaluate((caixas) => {
      const img = document.getElementById("i");
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return caixas.map((c) => {
        /* 4px de folga: a aresta acesa da pá e a quina do recorte são 1px de
           metal, não superfície de texto — a 1.4.3 mede o fundo ATRÁS da
           letra, e nenhuma letra encosta na borda da peça. */
        const d = ctx.getImageData(c.x + 4, c.y + 4, c.w - 8, Math.round(c.h / 2) - 4).data;
        let melhor = null;
        let ml = -1;
        for (let i = 0; i < d.length; i += 4) {
          const p = [d[i], d[i + 1], d[i + 2]];
          const l = lum(...p);
          if (l > ml) {
            ml = l;
            melhor = p;
          }
        }
        return { px: melhor, lum: ml };
      });
    }, caixas);
    achados.forEach((r, i) => {
      if (r.px && r.lum > pior[i].lum) pior[i] = { ...r, rotulo: rotulos[i] };
    });
    await pagina.waitForTimeout(INTERVALO);
  }

  console.log(`\n${rota}   texto rgb(${texto.join(",")})`);
  pior.forEach((p, i) => {
    if (!p.px) return;
    const r = razao(texto, p.px);
    medidos++;
    if (r < MINIMO) reprovados++;
    console.log(
      `  janela ${i} · pior quadro ${p.rotulo}`.padEnd(40) +
        `mais claro rgb(${p.px.join(",")})`.padEnd(30) +
        `${r.toFixed(2)}:1  ${r < MINIMO ? "REPROVA" : "ok"}`,
    );
  });
  await pagina.close();
}

/* ── A PAREDE ───────────────────────────────────────────────────────────
   A parede clareia o fundo da página, e fundo mais claro derruba o contraste
   de TODO texto que corre em cima dele. Não é preciso medir cada parágrafo:
   basta o pior par possível, e ele é único —

     o pixel MAIS CLARO que a parede produz  ×  o texto MAIS ESCURO do site.

   Se esse par passa, todos passam: não existe texto mais escuro que
   --texto-3 nem fundo mais claro que a linha da parede. Medir parágrafo por
   parágrafo seria mais trabalho e menos garantia.

   A leitura é feita com o conteúdo da página escondido, para não confundir a
   linha da parede com qualquer outra coisa clara da tela.

   CINCO ROTAS E NÃO UMA. Enquanto a parede era só o mapa, medir a capa
   bastava: os cinco SVG saem do mesmo gerador, com o mesmo teto de alfa no
   fio claro. Desde a camada fotográfica (28/08) isso deixou de valer — cada
   rota tem a sua foto, e foto não tem teto de fábrica. O equalizador do
   logos/baixar-fotos.mjs iguala a MÉDIA das cinco, e média igual não é pico
   igual: uma janela acesa de hotel é mais clara que qualquer nuvem. Quem
   decide se a foto passou é este laço, não o alvo do equalizador. */
let piorParede = { lum: -1, px: null, rota: "" };
let textos;
for (const rota of ROTAS) {
  const prova = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await prova.goto(`http://localhost:${PORTA}${rota}`, { waitUntil: "networkidle" });
  textos = await prova.evaluate(() => {
    const c = document.createElement("canvas").getContext("2d");
    const emRGB = (v) => {
      c.fillStyle = v;
      c.fillRect(0, 0, 1, 1);
      return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const raiz = getComputedStyle(document.documentElement);
    const cores = {
      "--texto-3": emRGB(raiz.getPropertyValue("--texto-3").trim()),
      "--texto-2": emRGB(raiz.getPropertyValue("--texto-2").trim()),
    };
    document.querySelectorAll("body > *").forEach((n) => (n.style.display = "none"));
    return cores;
  });
  await prova.waitForTimeout(200);
  const pngParede = await prova.screenshot();
  await leitor.setContent(`<img id="i" src="data:image/png;base64,${pngParede.toString("base64")}">`);
  await leitor.waitForFunction(() => document.getElementById("i").complete);
  const pixelParede = await leitor.evaluate(() => {
    const img = document.getElementById("i");
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let melhor = null;
    let ml = -1;
    for (let i = 0; i < d.length; i += 4) {
      const p = [d[i], d[i + 1], d[i + 2]];
      const l = lum(...p);
      if (l > ml) {
        ml = l;
        melhor = p;
      }
    }
    return melhor;
  });
  await prova.close();

  const l = 0.2126 * pixelParede[0] + 0.7152 * pixelParede[1] + 0.0722 * pixelParede[2];
  if (l > piorParede.lum) piorParede = { lum: l, px: pixelParede, rota };
}

console.log(`\nparede · pixel mais claro rgb(${piorParede.px.join(",")}) — pior rota: ${piorParede.rota}`);
for (const [nome, rgb] of Object.entries(textos)) {
  const r = razao(rgb, piorParede.px);
  medidos++;
  if (r < MINIMO) reprovados++;
  console.log(
    `  ${nome} rgb(${rgb.join(",")}) sobre a linha da parede`.padEnd(58) +
      `${r.toFixed(2)}:1  ${r < MINIMO ? "REPROVA" : "ok"}`,
  );
}

console.log(`\n${medidos} pares medidos · ${reprovados} reprovado(s) · mínimo ${MINIMO}:1`);
await navegador.close();
servidor.close();
process.exit(reprovados ? 1 : 0);
