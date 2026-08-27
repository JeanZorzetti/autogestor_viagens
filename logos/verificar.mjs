// Prova no navegador. Recomendação sem evidência não sai daqui.
//   npm run build && node logos/verificar.mjs
//
// SOBE O BUILD, NÃO O DEV SERVER. O `astro dev` injeta a barra de ferramentas
// do Astro: DOM extra e ~1,8 MB de JavaScript que não existem em produção.
// Medir LCP contra isso é medir outra página.
//
// O que ele prova, e por que cada um está aqui:
//   · 3 larguras × 4 posições de rolagem — screenshot do topo não prova
//     coreografia nenhuma; o gesto desta direção acontece descendo.
//   · 1 quadro de hover na linha da placa — a camada de ponteiro é opcional e
//     declarada, então precisa aparecer funcionando ou ser removida.
//   · 3 quadros da pá NO MEIO DA QUEDA, congelados pela Web Animations API —
//     a matéria desta direção é uma peça caindo, e peça caindo não aparece em
//     quadro parado. Provam que a luz corre atrás do ângulo em vez de a pá
//     aterrissar já acesa.
//   · 1 quadro com prefers-reduced-motion — provando que a placa sobrevive
//     parada. É o piso da direção, não um extra.
//   · console limpo, e nenhum deslocamento de layout entre os quadros.
//   · LCP e CLS medidos com CPU estrangulada, contra o orçamento declarado.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, rm } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const RAIZ = ".vercel/output/static";
const SAIDA = "logos/_verificacao";
const PORTA = 4321;
const ORCAMENTO = { lcp: 1500, cls: 0.05, js: 0 }; // faixa Captação — ver o manifesto no README

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

const servidor = createServer(async (req, res) => {
  const caminho = decodeURIComponent(req.url.split("?")[0]);
  const tentativas = [caminho, `${caminho}.html`, join(caminho, "index.html")];
  for (const t of tentativas) {
    const arquivo = join(RAIZ, normalize(t).replace(/^(\.\.[/\\])+/, ""));
    try {
      const corpo = await readFile(arquivo);
      res.writeHead(200, { "content-type": TIPOS[extname(arquivo)] ?? "application/octet-stream" });
      return res.end(corpo);
    } catch {}
  }
  res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
  res.end(await readFile(join(RAIZ, "404.html")).catch(() => "404"));
});

await new Promise((r) => servidor.listen(PORTA, r));
await rm(SAIDA, { recursive: true, force: true });
await mkdir(SAIDA, { recursive: true });

const base = `http://localhost:${PORTA}`;
const navegador = await chromium.launch();
const problemas = [];

// ── 3 larguras × 4 posições de rolagem ──────────────────────────────────────
for (const [nome, largura, altura] of [
  ["360", 360, 780],
  ["768", 768, 1024],
  ["1440", 1440, 900],
]) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura } });
  const pagina = await ctx.newPage();
  const console_ = [];
  pagina.on("console", (m) => m.type() === "error" && console_.push(m.text()));
  pagina.on("pageerror", (e) => console_.push(`pageerror: ${e.message}`));

  await pagina.goto(base, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);

  const alturaTotal = await pagina.evaluate(() => document.documentElement.scrollHeight);
  for (const pct of [0, 33, 66, 100]) {
    await pagina.evaluate((p) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollTo({ top: (max * p) / 100, behavior: "instant" });
    }, pct);
    await pagina.waitForTimeout(700); // deixa a pá terminar de virar
    await pagina.screenshot({ path: `${SAIDA}/${nome}-${String(pct).padStart(3, "0")}.png` });
  }

  // Estouro horizontal: o corpo nunca pode rolar para o lado.
  const estouro = await pagina.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (estouro > 1) problemas.push(`${nome}px: corpo rola ${estouro}px para o lado`);
  if (console_.length) problemas.push(`${nome}px: console sujo — ${console_.join(" | ")}`);

  console.log(`${nome}px  altura ${alturaTotal}px  console ${console_.length ? "SUJO" : "limpo"}  estouro ${estouro}px`);
  await ctx.close();
}

// ── quadro de hover: a camada de ponteiro ───────────────────────────────────
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.locator(".linha").first().hover();
  await pagina.waitForTimeout(600);
  await pagina.screenshot({ path: `${SAIDA}/1440-hover.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  const virou = await pagina.locator(".linha").first().locator(".status__b").isVisible();
  if (!virou) problemas.push("hover: a face B do status não apareceu");
  console.log(`hover   status virou: ${virou}`);
  await ctx.close();
}

// ── quadros da pá caindo: a matéria em movimento ────────────────────────────
// Quadro parado não prova a peça. A pá tem corpo (duas metades, vinco, aresta
// acesa) e uma camada de luz que acende conforme ela se vira para a fonte — se
// essa camada dessincronizar do giro, a peça acende antes de aterrissar e
// ninguém percebe olhando a placa parada.
//
// Como o quadro é congelado sem gravar vídeo: pausa e rebobina pela Web
// Animations API. NÃO dá para fazer isso trocando `--pa-giro` no CSS — o
// `animation-delay` é resolvido quando a animação nasce e o Chromium não
// reinicia uma animação em curso porque a custom property que alimenta o delay
// mudou. Foi a primeira tentativa e ela media sombra 0.00 nos três quadros,
// que é exatamente o que se veria se a camada estivesse quebrada: o falso
// negativo mais perigoso que existe, porque parece um achado.
//
// Todas as pás vão para o MESMO ponto da linha do tempo. A pá 0 nasce com
// delay negativo de um giro, então esse ponto cai dentro da queda dela; as
// outras sete têm delay positivo, ainda não começaram, e o `both` as segura no
// quadro 0 — que é a pá fora de vista. Uma peça caindo, sete guardadas.
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);

  const lidas = [];
  for (const [nome, local] of [
    ["queda-inicio", 30],
    ["queda-meio", 110],
    ["queda-fim", 260],
  ]) {
    await pagina.evaluate((local) => {
      const pas = document.getAnimations().filter((a) => a.effect?.target?.classList?.contains("destino__pa"));
      // O delay é o mesmo para a pá 0 e para o ::before dela — os dois andam
      // no mesmo ciclo, e é essa sincronia que o quadro está aqui para provar.
      const delay = pas[0].effect.getComputedTiming().delay;
      for (const a of pas) {
        a.pause();
        a.currentTime = delay + local;
      }
    }, local);
    await pagina.waitForTimeout(120);
    const caixa = await pagina.locator(".destino").boundingBox();
    await pagina.screenshot({
      path: `${SAIDA}/1440-${nome}.png`,
      clip: { x: caixa.x - 8, y: caixa.y - 8, width: Math.min(760, caixa.width + 16), height: caixa.height + 16 },
    });
    lidas.push([
      nome,
      await pagina.evaluate(
        () => +getComputedStyle(document.querySelector(".destino__pa"), "::before").opacity
      ),
    ]);
  }

  // A camada de luz tem que estar escura no começo da queda e ter APAGADO no
  // fim. Medir só um ponto não prova sincronia: prova que existe uma sombra.
  // O que prova é a rampa — escuro cedo, claro na aterrissagem.
  const [inicio, , fim] = lidas.map(([, v]) => v);
  if (!(inicio > 0.5)) problemas.push(`queda: a peça começou o giro a ${inicio.toFixed(2)} de sombra, esperava > 0.5`);
  if (!(fim < 0.1)) problemas.push(`queda: a peça aterrissou com ${fim.toFixed(2)} de sombra, esperava < 0.1`);
  console.log(`queda   sombra ${lidas.map(([n, v]) => `${n.replace("queda-", "")} ${v.toFixed(2)}`).join(" → ")}`);
  await ctx.close();
}

// ── quadro com movimento reduzido: o piso ───────────────────────────────────
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  await pagina.goto(base, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${SAIDA}/1440-reduzido.png` });

  // A pá parada tem que mostrar UM destino, não zero e não oito.
  const visiveis = await pagina.$$eval(".destino__pa", (ns) =>
    ns.filter((n) => getComputedStyle(n).opacity !== "0").length
  );
  if (visiveis !== 1) problemas.push(`reduced-motion: ${visiveis} destinos visíveis, esperava 1`);
  console.log(`reduzido  destinos visíveis: ${visiveis}`);
  await ctx.close();
}

// ── passagem de teclado ─────────────────────────────────────────────────────
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base, { waitUntil: "networkidle" });
  const parada = [];
  for (let i = 0; i < 22; i++) {
    await pagina.keyboard.press("Tab");
    const alvo = await pagina.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const e = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        tag: a.tagName.toLowerCase(),
        texto: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 42).replace(/\s+/g, " "),
        anel: e.outlineStyle !== "none" && parseFloat(e.outlineWidth) > 0,
        visivel: r.width > 0 && r.height > 0,
      };
    });
    if (!alvo) break;
    parada.push(alvo);
  }
  const semAnel = parada.filter((p) => !p.anel && p.visivel);
  if (semAnel.length) problemas.push(`teclado: ${semAnel.length} parada(s) sem anel de foco`);
  console.log(`teclado ${parada.length} paradas, ${semAnel.length} sem anel`);
  parada.forEach((p, i) => console.log(`   ${String(i + 1).padStart(2)} ${p.anel ? "▣" : "▢"} <${p.tag}> ${p.texto}`));
  await ctx.close();
}

// ── LCP, CLS e peso, com CPU 4× estrangulada ────────────────────────────────
{
  const amostras = [];
  for (let i = 0; i < 5; i++) {
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    const pagina = await ctx.newPage();
    let bytesJs = 0;
    pagina.on("response", async (r) => {
      if (r.url().endsWith(".js")) bytesJs += Number(r.headers()["content-length"] ?? 0);
    });
    const cdp = await ctx.newCDPSession(pagina);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await pagina.goto(base, { waitUntil: "load" });
    await pagina.waitForTimeout(2500);
    const m = await pagina.evaluate(
      () =>
        new Promise((res) => {
          let lcp = 0,
            cls = 0,
            alvo = "";
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) {
              lcp = e.startTime;
              alvo = e.element?.tagName + (e.element?.className ? "." + String(e.element.className).split(" ")[0] : "");
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => res({ lcp, cls, alvo }), 300);
        })
    );
    amostras.push({ ...m, bytesJs });
    await ctx.close();
  }
  const mediana = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const lcp = Math.round(mediana(amostras.map((a) => a.lcp)));
  const cls = Math.max(...amostras.map((a) => a.cls));
  const js = Math.max(...amostras.map((a) => a.bytesJs));
  console.log(`\nLCP mediana ${lcp}ms (alvo ${ORCAMENTO.lcp})  amostras ${amostras.map((a) => Math.round(a.lcp)).join(", ")}`);
  console.log(`elemento de LCP: ${amostras[0].alvo}`);
  console.log(`CLS pior ${cls.toFixed(4)} (alvo ${ORCAMENTO.cls})   JS próprio ${js} bytes (orçamento ${ORCAMENTO.js})`);
  if (lcp > ORCAMENTO.lcp) problemas.push(`LCP ${lcp}ms acima do orçamento (${ORCAMENTO.lcp}ms)`);
  if (cls > ORCAMENTO.cls) problemas.push(`CLS ${cls.toFixed(4)} acima do orçamento (${ORCAMENTO.cls})`);
  if (js > ORCAMENTO.js) problemas.push(`${js} bytes de JS, o orçamento declarado é ${ORCAMENTO.js}`);
}

await navegador.close();
servidor.close();

console.log(`\n${problemas.length ? `${problemas.length} PROBLEMA(S):` : "sem problemas."}`);
for (const p of problemas) console.log(`  · ${p}`);
console.log(`quadros em ${SAIDA}/`);
process.exit(problemas.length ? 1 : 0);
