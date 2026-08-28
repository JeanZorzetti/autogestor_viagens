// Prova no navegador. Recomendação sem evidência não sai daqui.
//   npm run build && node logos/verificar.mjs
//
// SOBE O BUILD, NÃO O DEV SERVER. O `astro dev` injeta a barra de
// ferramentas do Astro: DOM extra e ~1,8 MB de JavaScript que não existem em
// produção. Medir LCP contra isso é medir outra página.
//
// 001-painel-e-portoes (T053) reescreveu o laço: a linha de base era 1 rota
// (só a capa, `:77` antigo — `pagina.goto(base, …)`, sem laço nenhum). Agora
// são NOVE: `/`, os quatro portões, `/sobre`, `/privacidade`, `/termos` e
// `/404`. Isto não é a mesma varredura parametrizada — é um laço novo, com
// quatro decisões tomadas por escrito (ver handoff.md G1/G3 da feature):
//
//   1. Quais quadros especiais valem por rota. `reduced-motion` e teclado são
//      POR ROTA (9) — cada portão precisa sobreviver parado e navegável.
//      `hover` e a QUEDA DA PÁ só existem onde há coluna girando: a capa e as
//      quatro cabeças de portão (5 rotas) — as quatro rotas de documento
//      (`/sobre`, `/privacidade`, `/termos`, `/404`) não têm pá nenhuma.
//      O quadro da TRANSIÇÃO e a prova de DEGRADAÇÃO (T051) são de uma
//      passagem só (capa → um portão) e não entram neste laço.
//   2. Nome do arquivo: `{rota}-{largura}-{pct}.png`, `rota` = o slug
//      (`capa` para `/`, `404` para `/404`). Especiais:
//      `{rota}-{largura}-{quadro}` (`capa-1440-hover`, `hoteis-1440-reduzido`).
//   3. `ORCAMENTO` é por rota — SC-003 pede "LCP mediano ≤800ms POR ROTA", e
//      um número global deixaria a capa seguar a mediana de um portão lento.
//   4. Fica mais lento, e a saída não é cortar cobertura — é custo de
//      ferramenta, não de página (plan.md). A varredura principal roda em
//      paralelo por rota (teto de 4 workers, para não estrangular a própria
//      máquina que está medindo LCP); o bloco de LCP/CLS roda SERIAL mesmo
//      assim — medida sob contenção não é medida.
//
// Dois ajustes que entraram na mesma passada, porque são o mesmo laço:
//   · I6 — FR-011/T042 provam 360×640 (a quarta linha visível/meio-visível);
//     o laço antigo só tinha 360×780. Os dois ficam.
//   · I8 — o breakpoint de FR-013 é 46rem = 736px; o laço antigo pulava
//     direto de 360 para 768, e a faixa 736–767 nunca era fotografada.
import { chromium, firefox } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, rm } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const RAIZ = ".vercel/output/static";
const SAIDA = "logos/_verificacao";
/* 4331 e NÃO 4321, e a troca veio de um harness que mentiu por uma sessão
   inteira. 4321 é a porta padrão do `astro dev`. Com um dev server aberto na
   máquina — o caso normal de quem está editando o site — os dois coexistem em
   silêncio: o dev do Astro escuta em `[::1]` (IPv6) e este `listen` pega o
   `0.0.0.0` (IPv4), nenhum dos dois falha, e aí o Playwright navega para
   `localhost`, que no Windows resolve IPv6 primeiro. Resultado: esta varredura
   fotografa e cronometra O DEV SERVER, com a barra de ferramentas do Astro na
   tela e ~1,8 MB de JavaScript que não existem em produção — exatamente o que
   o comentário no topo deste arquivo manda evitar, acontecendo por baixo dele.
   O sintoma era LCP alto e errático na capa e "console sujo" que não se
   reproduzia fora daqui. */
const PORTA = 4331;

// SC-003/SC-004: 800ms e 0,01 são os números que a spec mede de fato; 1500ms
// é só o teto declarado da faixa Captação (contexto, não o gate).
const ORCAMENTO = { lcp: 800, cls: 0.01, js: 0 };

const ROTAS = [
  { slug: "capa", caminho: "/" },
  { slug: "passagens-aereas", caminho: "/passagens-aereas" },
  { slug: "hoteis", caminho: "/hoteis" },
  { slug: "pacotes", caminho: "/pacotes" },
  { slug: "aluguel-de-carro", caminho: "/aluguel-de-carro" },
  { slug: "sobre", caminho: "/sobre" },
  { slug: "privacidade", caminho: "/privacidade" },
  { slug: "termos", caminho: "/termos" },
  { slug: "404", caminho: "/404" },
];

// Onde existe coluna girando: a capa (4 linhas) e as 4 cabeças de portão.
const ROTAS_COM_GIRO = new Set(["capa", "passagens-aereas", "hoteis", "pacotes", "aluguel-de-carro"]);

const LARGURAS = [
  { nome: "360", largura: 360, altura: 780 }, // I6 soma 360×640 à parte, abaixo
  { nome: "736", largura: 736, altura: 1024 }, // I8 — o breakpoint real de 46rem
  { nome: "768", largura: 768, altura: 1024 },
  { nome: "1440", largura: 1440, altura: 900 },
];

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

/* E se a porta nova também estiver ocupada, esta varredura PARA. Sem este
   handler o `listen` emite 'error' sem ouvinte e o processo morre com um
   stack de rede; com ele, morre dizendo o que fazer. O que não pode voltar a
   acontecer é medir em silêncio o que não é o build. */
servidor.once("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `porta ${PORTA} ocupada — feche o que está nela e rode de novo (esta varredura precisa servir o BUILD, não outro servidor)`
      : e,
  );
  process.exit(1);
});
await new Promise((r) => servidor.listen(PORTA, "127.0.0.1", r));
await rm(SAIDA, { recursive: true, force: true });
await mkdir(SAIDA, { recursive: true });

/* 127.0.0.1 e não `localhost`: é o mesmo bug pela outra ponta — `localhost`
   resolve IPv6 primeiro no Windows, e basta qualquer coisa escutando em
   `[::1]` na mesma porta para a varredura sair medindo outro servidor. */
const base = `http://127.0.0.1:${PORTA}`;
const navegador = await chromium.launch();
const problemas = [];

/** Teto pequeno de propósito (decisão 4): mais que isso estrangula a própria
 *  máquina que está medindo LCP no bloco final, que roda depois e serial. */
async function emLotes(itens, teto, tarefa) {
  const fila = [...itens];
  const resultados = [];
  await Promise.all(
    Array.from({ length: teto }, async () => {
      while (fila.length) {
        const item = fila.shift();
        resultados.push(await tarefa(item));
      }
    })
  );
  return resultados;
}

// ── varredura principal: 9 rotas × 4 larguras × 4 posições de rolagem ───────
async function varrerRota(rota) {
  const locais = [];
  for (const L of LARGURAS) {
    const ctx = await navegador.newContext({ viewport: { width: L.largura, height: L.altura } });
    const pagina = await ctx.newPage();
    const consoleMsgs = [];
    pagina.on("console", (m) => m.type() === "error" && consoleMsgs.push(m.text()));
    pagina.on("pageerror", (e) => consoleMsgs.push(`pageerror: ${e.message}`));

    await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
    await pagina.evaluate(() => document.fonts.ready);

    for (const pct of [0, 33, 66, 100]) {
      await pagina.evaluate((p) => {
        const max = document.documentElement.scrollHeight - innerHeight;
        scrollTo({ top: (max * p) / 100, behavior: "instant" });
      }, pct);
      await pagina.waitForTimeout(700); // deixa a pá terminar de virar
      await pagina.screenshot({ path: `${SAIDA}/${rota.slug}-${L.nome}-${String(pct).padStart(3, "0")}.png` });
    }

    const estouro = await pagina.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (estouro > 1) locais.push(`${rota.slug} @ ${L.nome}px: corpo rola ${estouro}px para o lado`);
    if (consoleMsgs.length) locais.push(`${rota.slug} @ ${L.nome}px: console sujo — ${consoleMsgs.join(" | ")}`);
    await ctx.close();
  }

  // I6 — FR-011/T042: a quarta linha da capa visível ou meio-visível em
  // 360×640 (nem sempre igual a 360×780, que é a largura da varredura acima).
  if (rota.slug === "capa") {
    const ctx = await navegador.newContext({ viewport: { width: 360, height: 640 } });
    const pagina = await ctx.newPage();
    await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.screenshot({ path: `${SAIDA}/capa-360x640-topo.png` });
    const linhas = await pagina.locator(".linhas > li").count();
    const quarta = pagina.locator(".linhas > li").nth(3);
    const visivel = (await quarta.boundingBox())?.y < 640;
    if (linhas !== 4) locais.push(`capa: painel tem ${linhas} linhas, deveria ter exatamente 4 (FR-008)`);
    if (!visivel) locais.push("capa @ 360×640: a quarta linha está completamente abaixo da dobra (FR-011)");
    await ctx.close();
  }

  console.log(`${rota.slug.padEnd(18)} varrido  ${locais.length ? `${locais.length} problema(s)` : "sem problemas"}`);
  return locais;
}

problemas.push(...(await emLotes(ROTAS, 4, varrerRota)).flat());

// ── quadro de hover: a camada de ponteiro, só onde há coluna girando ────────
for (const slug of ROTAS_COM_GIRO) {
  const rota = ROTAS.find((r) => r.slug === slug);
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  const alvoHover = slug === "capa" ? ".linha" : ".cabeca-portao__volta";
  await pagina.locator(alvoHover).first().hover();
  await pagina.waitForTimeout(600);
  await pagina.screenshot({ path: `${SAIDA}/${slug}-1440-hover.png` });
  if (slug === "capa") {
    const virou = await pagina.locator(".linha").first().locator(".status__b").isVisible();
    if (!virou) problemas.push("capa @ hover: a face B do status não apareceu");
  }
  await ctx.close();
}
console.log(`hover   ${ROTAS_COM_GIRO.size} rota(s) com coluna girando`);

// ── quadros da pá caindo: a matéria em movimento, mesmas 5 rotas ────────────
// Quadro parado não prova a peça. A pá tem corpo (duas metades, vinco, aresta
// acesa) e uma camada de luz que acende conforme se vira para a fonte — se
// essa camada dessincronizar do giro, a peça acende antes de aterrissar e
// ninguém percebe olhando a placa parada. Congelado pela Web Animations API a
// partir do primeiro `.coluna-destino__pa` de cada rota — funciona igual nas
// 5, porque o primitivo é o mesmo (T009) em qualquer N.
for (const slug of ROTAS_COM_GIRO) {
  const rota = ROTAS.find((r) => r.slug === slug);
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);

  const lidas = [];
  for (const [nome, local] of [
    ["queda-inicio", 30],
    ["queda-meio", 110],
    ["queda-fim", 260],
  ]) {
    await pagina.evaluate((local) => {
      const pas = document.getAnimations().filter((a) => a.effect?.target?.classList?.contains("coluna-destino__pa"));
      const delay = pas[0].effect.getComputedTiming().delay;
      for (const a of pas) {
        a.pause();
        a.currentTime = delay + local;
      }
    }, local);
    await pagina.waitForTimeout(120);
    const caixa = await pagina.locator(".coluna-destino__janela").first().boundingBox();
    await pagina.screenshot({
      path: `${SAIDA}/${slug}-1440-${nome}.png`,
      clip: { x: caixa.x - 8, y: caixa.y - 8, width: Math.min(760, caixa.width + 16), height: caixa.height + 16 },
    });
    lidas.push([
      nome,
      await pagina.evaluate(() => +getComputedStyle(document.querySelector(".coluna-destino__pa"), "::before").opacity),
    ]);
  }

  const [inicio, , fim] = lidas.map(([, v]) => v);
  if (!(inicio > 0.5)) problemas.push(`${slug} @ queda: começou a ${inicio.toFixed(2)} de sombra, esperava > 0.5`);
  if (!(fim < 0.1)) problemas.push(`${slug} @ queda: aterrissou com ${fim.toFixed(2)} de sombra, esperava < 0.1`);
  console.log(`${slug.padEnd(18)} queda   sombra ${lidas.map(([n, v]) => `${n.replace("queda-", "")} ${v.toFixed(2)}`).join(" → ")}`);
  await ctx.close();
}

// ── quadro com movimento reduzido: o piso, por rota ─────────────────────────
for (const rota of ROTAS) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  const consoleMsgs = [];
  pagina.on("console", (m) => m.type() === "error" && consoleMsgs.push(m.text()));
  await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${SAIDA}/${rota.slug}-1440-reduzido.png` });

  if (ROTAS_COM_GIRO.has(rota.slug)) {
    // Cada COLUNA (não a página inteira) precisa mostrar exatamente 1 destino.
    const porColuna = await pagina.$$eval(".coluna-destino__janela", (janelas) =>
      janelas.map((j) => [...j.querySelectorAll(".coluna-destino__pa")].filter((n) => getComputedStyle(n).opacity !== "0").length)
    );
    const erradas = porColuna.filter((v) => v !== 1);
    if (erradas.length) problemas.push(`${rota.slug} @ reduced-motion: ${erradas.length} coluna(s) sem exatamente 1 destino visível`);
    console.log(`${rota.slug.padEnd(18)} reduzido  colunas: ${porColuna.join(", ")}`);
  } else {
    console.log(`${rota.slug.padEnd(18)} reduzido  (sem coluna girando)`);
  }
  if (consoleMsgs.length) problemas.push(`${rota.slug} @ reduced-motion: console sujo — ${consoleMsgs.join(" | ")}`);
  await ctx.close();
}

// ── T051 · o quadro da transição capa → portão ──────────────────────────────
// Congelado pela Web Animations API a partir de `pagereveal` no documento
// NOVO — é o único ponto que roda antes de a transição começar. Dois
// quadros: 60ms (o corpo virando) e 140ms (o corpo praticamente fora — é
// onde um órfão parado denunciaria o G4 voltando). Falha se qualquer
// `::view-transition-old(vt-*)` estiver rodando `-ua-view-transition-fade-out`
// — esse nome de animação É o bug do G4.
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base + "/", { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);

  await pagina.evaluate(() => {
    window.__quadros = [];
    document.addEventListener("pagereveal", (e) => {
      if (!e.viewTransition) return;
      e.viewTransition.ready.then(() => {
        for (const a of document.getAnimations()) {
          const pe = a.effect?.pseudoElement ?? "";
          if (pe.startsWith("::view-transition")) a.pause();
        }
      });
    });
  });
  await pagina.locator(".linha").first().click();
  await pagina.waitForURL(/passagens-aereas/, { timeout: 3000 }).catch(() => {});
  await pagina.waitForTimeout(200);

  for (const [nome, t] of [
    ["60ms", 60],
    ["140ms", 140],
  ]) {
    const fadeEncontrado = await pagina.evaluate((t) => {
      let achado = false;
      for (const a of document.getAnimations()) {
        const pe = a.effect?.pseudoElement ?? "";
        if (!pe.startsWith("::view-transition")) continue;
        a.currentTime = t;
        if (pe.includes("vt-") && pe.includes("old") && a.animationName === "-ua-view-transition-fade-out") achado = true;
      }
      return achado;
    }, t);
    await pagina.screenshot({ path: `${SAIDA}/transicao-capa-portao-${nome}.png` });
    if (fadeEncontrado) problemas.push(`transição @ ${nome}: um vt-* órfão está rodando o fade padrão do navegador (G4 voltou)`);
  }
  console.log("transição   quadros de 60ms e 140ms congelados, ver logos/_verificacao/transicao-*.png");
  await ctx.close();
}

// ── T051 · a prova da degradação, no engine que NÃO faz VT cross-document ───
// Confirmado em 2026-08-28 (Firefox 144): suporta view-transition-name e
// document.startViewTransition (same-document), mas NÃO onpagereveal — é essa
// propriedade, e não CSS.supports, que separa os dois grupos de engine.
{
  const nav2 = await firefox.launch();
  const ctx = await nav2.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  const consoleMsgs = [];
  pagina.on("console", (m) => m.type() === "error" && consoleMsgs.push(m.text()));
  pagina.on("pageerror", (e) => consoleMsgs.push(`pageerror: ${e.message}`));

  const suportaPageReveal = await pagina.evaluate(() => "onpagereveal" in window);
  await pagina.goto(base + "/", { waitUntil: "networkidle" });
  await pagina.locator(".linha").first().click();
  await pagina.waitForURL(/passagens-aereas/, { timeout: 3000 }).catch(() => {});
  const h1 = await pagina.locator("h1").first().isVisible();
  const objeto = await pagina.locator(".cabeca-portao__objeto").isVisible();
  await pagina.screenshot({ path: `${SAIDA}/degradacao-firefox-passagens-aereas.png` });

  if (suportaPageReveal) problemas.push("degradação: Firefox agora suporta onpagereveal — o engine da prova mudou, revisar SC-009");
  if (!h1 || !objeto) problemas.push("degradação (Firefox): conteúdo do portão incompleto após a navegação");
  if (consoleMsgs.length) problemas.push(`degradação (Firefox): console sujo — ${consoleMsgs.join(" | ")}`);
  console.log(`degradação  Firefox onpagereveal=${suportaPageReveal}  conteúdo completo=${h1 && objeto}`);
  await ctx.close();
  await nav2.close();
}

// ── passagem de teclado, por rota ────────────────────────────────────────────
for (const rota of ROTAS) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
  const parada = [];
  for (let i = 0; i < 26; i++) {
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
  if (semAnel.length) problemas.push(`${rota.slug} @ teclado: ${semAnel.length} parada(s) sem anel de foco`);
  console.log(`${rota.slug.padEnd(18)} teclado ${parada.length} paradas, ${semAnel.length} sem anel`);
  await ctx.close();
}

// ── LCP, CLS e peso, com CPU 4× estrangulada — POR ROTA, SERIAL ─────────────
// Medida sob contenção não é medida: este bloco não entra no `emLotes`.
for (const rota of ROTAS) {
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
    await pagina.goto(base + rota.caminho, { waitUntil: "load" });
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
  console.log(
    `${rota.slug.padEnd(18)} LCP ${lcp}ms (orçamento ${ORCAMENTO.lcp})  CLS ${cls.toFixed(4)} (orçamento ${ORCAMENTO.cls})  JS ${js}B  elemento ${amostras[0].alvo}`
  );
  if (lcp > ORCAMENTO.lcp) problemas.push(`${rota.slug}: LCP ${lcp}ms acima do orçamento (${ORCAMENTO.lcp}ms)`);
  if (cls > ORCAMENTO.cls) problemas.push(`${rota.slug}: CLS ${cls.toFixed(4)} acima do orçamento (${ORCAMENTO.cls})`);
  if (js > ORCAMENTO.js) problemas.push(`${rota.slug}: ${js} bytes de JS, o orçamento declarado é ${ORCAMENTO.js}`);
}

await navegador.close();
servidor.close();

console.log(`\n${problemas.length ? `${problemas.length} PROBLEMA(S):` : "sem problemas."}`);
for (const p of problemas) console.log(`  · ${p}`);
console.log(`quadros em ${SAIDA}/`);
process.exit(problemas.length ? 1 : 0);
