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
//
// `js` NÃO é zero: o GA4 (Base.astro) carrega gtag.js depois do `load`, medido
// em ~172000B nas nove rotas (script + 1 fetch de coleta). O filtro antigo
// (`r.url().endsWith(".js")`) media 0 porque a URL do gtag termina em query
// string (`?id=…`), não em `.js` — o número nunca correspondeu à rede real.
// O orçamento aqui é o próprio GA4, com folga; o script inline de ~0,2kb da
// capa (view-transition-name órfão) já foi removido, ver global.css.
const ORCAMENTO = { lcp: 800, cls: 0.01, js: 180_000 };

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
// As cinco rotas que abrem com fotografia. As quatro de documento (/sobre,
// /privacidade, /termos, /404) não têm abertura nem camada de ponteiro.
const ROTAS_COM_FOTO = new Set(["capa", "passagens-aereas", "hoteis", "pacotes", "aluguel-de-carro"]);

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

  // A DOBRA DO CELULAR PEQUENO, em 360×640 — o aparelho mais apertado que
  // este site atende, e nem sempre igual a 360×780.
  //
  // A invariante MUDOU com a direção, e vale dizer o que ela era: na placa
  // Solari o que precisava caber era a QUARTA LINHA do painel, porque as
  // quatro linhas eram o índice e o CTA ao mesmo tempo. Na Vitrine as quatro
  // peças são fotografias empilhadas e nenhuma delas cabe na primeira tela do
  // celular — exigir isso seria transportar um requisito de um desenho para
  // outro só porque ele estava escrito.
  //
  // O que precisa caber agora é a ABERTURA INTEIRA: a janela, a promessa e o
  // botão. Se o CTA principal cai abaixo da dobra no aparelho mais apertado, a
  // primeira tela virou pôster e deixou de ser página de captação.
  if (rota.slug === "capa") {
    const ctx = await navegador.newContext({ viewport: { width: 360, height: 640 } });
    const pagina = await ctx.newPage();
    await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
    await pagina.evaluate(() => document.fonts.ready.then(() => true));
    await pagina.waitForTimeout(400);
    await pagina.screenshot({ path: `${SAIDA}/capa-360x640-topo.png` });

    const cta = await pagina.locator(".abertura .btn--primario").boundingBox();
    const pecas = await pagina.locator(".vitrine__grade > li").count();
    if (pecas !== 4) locais.push(`capa: a vitrine tem ${pecas} peças, deveria ter exatamente 4`);
    if (!cta || cta.y + cta.height > 640)
      locais.push(`capa @ 360×640: o CTA da abertura cai abaixo da dobra (base em ${Math.round((cta?.y ?? 0) + (cta?.height ?? 0))}px)`);
    await ctx.close();
  }

  console.log(`${rota.slug.padEnd(18)} varrido  ${locais.length ? `${locais.length} problema(s)` : "sem problemas"}`);
  return locais;
}

problemas.push(...(await emLotes(ROTAS, 4, varrerRota)).flat());

// ── quadro de hover: a camada de PONTEIRO ──────────────────────────────────
// Na direção "janela de embarque" o ponteiro faz a janela ABRIR um pouco
// mais: o véu da peça recua e a fotografia cresce dentro da moldura parada.
// A prova é numérica, não só visual — um screenshot de hover parece igual ao
// de repouso para quem não sabe o que procurar.
for (const slug of ROTAS_COM_FOTO) {
  const rota = ROTAS.find((r) => r.slug === slug);
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready.then(() => true));

  // Só a capa tem peças. Nos portões o elemento que responde ao ponteiro é o
  // link de volta, e o que ele move é a própria seta.
  const alvo = slug === "capa" ? ".vitrine__grade > li:nth-child(1) .peca" : ".portao__volta";
  await pagina.locator(alvo).first().scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(400);
  await pagina.locator(alvo).first().hover();
  await pagina.waitForTimeout(800);
  await pagina.screenshot({ path: `${SAIDA}/${slug}-1440-hover.png` });

  if (slug === "capa") {
    const [veu, escala] = await pagina.evaluate(() => {
      const peca = document.querySelector(".vitrine__grade > li:nth-child(1) .peca");
      return [
        +getComputedStyle(peca.querySelector(".peca__veu")).opacity,
        getComputedStyle(peca.querySelector("img")).scale,
      ];
    });
    if (!(veu < 0.9)) problemas.push(`capa @ hover: o véu da peça não recuou (opacidade ${veu})`);
    if (escala === "none" || parseFloat(escala) <= 1)
      problemas.push(`capa @ hover: a fotografia não cresceu na moldura (scale ${escala})`);
    console.log(`capa               hover   véu ${veu} · foto ${escala}`);
  }
  await ctx.close();
}

// ── a camada de SCROLL: nenhuma peça pode ficar presa fechada ───────────────
// `animation-timeline: view()` recorta o elemento na entrada e o abre até o
// fim do intervalo. O modo de falha dela é silencioso e grave: um intervalo
// mal declarado deixa o `clip-path` travado num recorte parcial, e o conteúdo
// simplesmente não existe para quem chegou rolando — sem erro de console, sem
// nada. Aqui a página é rolada até o fim e cada elemento com a camada é lido:
// parado no lugar, ele TEM que estar aberto.
for (const slug of ROTAS_COM_FOTO) {
  const rota = ROTAS.find((r) => r.slug === slug);
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(base + rota.caminho, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready.then(() => true));

  const presos = await pagina.evaluate(async () => {
    const passo = innerHeight * 0.75;
    const ruins = [];
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
      for (const el of document.querySelectorAll(".abre")) {
        const c = el.getBoundingClientRect();
        // Só julga quem já passou do meio da tela: quem está entrando ainda
        // está recortado de propósito — é a animação acontecendo.
        if (c.top > innerHeight * 0.45 || c.bottom < 0) continue;
        const cp = getComputedStyle(el).clipPath;
        if (cp !== "none" && !/inset\(0(px|%)?( 0(px|%)?){0,3}\)/.test(cp))
          ruins.push(`${el.className.toString().slice(0, 24)} → ${cp}`);
      }
    }
    scrollTo(0, 0);
    return [...new Set(ruins)];
  });

  if (presos.length) problemas.push(`${slug} @ scroll: elemento preso fechado — ${presos.join(" | ")}`);
  console.log(`${slug.padEnd(18)} scroll  ${presos.length ? `${presos.length} preso(s)` : "tudo abre"}`);
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

  // O PISO. Sem movimento a tela não vira uma versão degradada: ela é a mesma
  // composição, parada. O que precisa ser verdade é que nada dependa de uma
  // animação ter rodado para existir — nenhum `.abre` recortado, nenhum
  // `.entra > *` deslocado para fora da própria caixa.
  const escondidos = await pagina.evaluate(() => {
    const ruins = [];
    for (const el of document.querySelectorAll(".abre")) {
      const cp = getComputedStyle(el).clipPath;
      if (cp !== "none" && !/inset\(0(px|%)?( 0(px|%)?){0,3}\)/.test(cp)) ruins.push(`.abre recortado: ${cp}`);
    }
    for (const el of document.querySelectorAll(".entra > *")) {
      const t = getComputedStyle(el).translate;
      if (t !== "none" && !/^0(px)?( 0(px)?)?$/.test(t)) ruins.push(`.entra deslocado: ${t}`);
    }
    return ruins;
  });
  if (escondidos.length)
    problemas.push(`${rota.slug} @ reduced-motion: ${escondidos.length} elemento(s) presos — ${escondidos.join(" | ")}`);
  console.log(`${rota.slug.padEnd(18)} reduzido  ${escondidos.length ? `${escondidos.length} preso(s)` : "tudo visível parado"}`);
  if (consoleMsgs.length) problemas.push(`${rota.slug} @ reduced-motion: console sujo — ${consoleMsgs.join(" | ")}`);
  await ctx.close();
}

// ── T051 · o quadro da transição, capa ⇄ portão ─────────────────────────────
// Congelado pela Web Animations API a partir de `pagereveal` no documento que
// ENTRA — é o único ponto que roda antes de a transição começar. Dois
// quadros: 60ms (o corpo virando) e 140ms (o corpo praticamente fora — é
// onde um órfão parado denunciaria o G4 voltando). Falha se algum nome de
// `view-transition` existir de um lado só (velho sem par novo, ou vice-versa).
//
// O listener é `ctx.addInitScript`, não `pagina.evaluate`: evaluate roda no
// documento ATUAL, e o pagereveal que importa dispara no documento seguinte,
// depois da navegação — um `pagina.evaluate` antes do clique nunca ouve esse
// evento, e a checagem só "passava" porque lia animações órfãs residuais aos
// 200ms, não porque congelava algo no instante certo.
//
// E as DUAS direções entram: capa→portão só prova o par vt-aer que a peça
// clicada carrega. É a VOLTA (portão→capa) que expõe as outras três peças da
// vitrine — vt-htl, vt-pct, vt-car — que não têm par no documento que sai do
// portão, e são órfãs de verdade toda vez que alguém aperta "Voltar ao
// saguão". O CSS abaixo (global.css, regra `:only-child`) existe por causa
// desta metade do gate.
for (const [rotulo, ida, clique, esperado] of [
  ["capa → portão", "/", ".vitrine__grade > li:nth-child(1) .peca", /passagens-aereas/],
  ["portão → capa", "/passagens-aereas", ".portao__volta", /^http:\/\/[^/]+\/$/],
]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
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
  const pagina = await ctx.newPage();
  await pagina.goto(base + ida, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.locator(clique).click();
  await pagina.waitForURL(esperado, { timeout: 3000 }).catch(() => {});
  await pagina.waitForTimeout(200);

  for (const [nome, t] of [
    ["60ms", 60],
    ["140ms", 140],
  ]) {
    /* ═══ O QUE É UM ÓRFÃO, DE VERDADE ═══════════════════════════════════
       Este detector já mediu a coisa errada e o registro fica: ele procurava
       `::view-transition-old(vt-*)` rodando `-ua-view-transition-fade-out` e
       chamava isso de órfão. Não é. Um par que CASA nos dois documentos
       também roda fade-out e fade-in — em `plus-lighter`, dentro do
       `::view-transition-group(vt-*)` que faz o morph. Esse cross-fade é
       como o navegador resolve dois quadros da MESMA imagem em tamanhos
       diferentes; ele não é o gesto "fade" que a direção proíbe, e acusá-lo
       reprovava a transição justamente quando ela estava certa.

       Órfão é o nome que existe de um lado só: tem `old(vt-X)` e não tem
       `new(vt-X)`, ou o contrário. */
    const fadeEncontrado = await pagina.evaluate((t) => {
      const velhos = new Set();
      const novos = new Set();
      for (const a of document.getAnimations()) {
        const pe = a.effect?.pseudoElement ?? "";
        if (!pe.startsWith("::view-transition")) continue;
        a.currentTime = t;
        const m = pe.match(/^::view-transition-(old|new)\((vt-[\w-]+)\)$/);
        if (m) (m[1] === "old" ? velhos : novos).add(m[2]);
      }
      const orfaos = [...velhos].filter((n) => !novos.has(n)).concat([...novos].filter((n) => !velhos.has(n)));
      return orfaos.length ? orfaos.join(", ") : false;
    }, t);
    await pagina.screenshot({ path: `${SAIDA}/transicao-${rotulo.replace(/[^a-z]+/gi, "-")}-${nome}.png` });
    if (fadeEncontrado)
      problemas.push(
        `transição @ ${rotulo} @ ${nome}: nome(s) de transição sem par nos dois documentos — ${fadeEncontrado}. ` +
          `O navegador resolve órfão com o fade padrão dele, que é o gesto que esta direção não usa.`,
      );
  }
  console.log(`transição   ${rotulo}  quadros de 60ms e 140ms congelados, ver logos/_verificacao/transicao-*.png`);
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
  // A primeira peça da vitrine é o link para /passagens-aereas. Era `.linha`
  // (a linha da placa) até a troca de direção; o alvo mudou, a prova não.
  await pagina.locator(".vitrine__grade > li:nth-child(1) .peca").click();
  await pagina.waitForURL(/passagens-aereas/, { timeout: 3000 }).catch(() => {});
  const h1 = await pagina.locator("h1").first().isVisible();
  // O que precisa ter sobrevivido à navegação sem view-transition é a
  // FOTOGRAFIA da abertura do portão — ela é a matéria da página, e era o
  // `.cabeca-portao__objeto` da direção anterior que ocupava este lugar.
  const objeto = await pagina.locator(".portao__abertura .foto img").first().isVisible();
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
    // `resourceType() === "script"` e não `url().endsWith(".js")`: o gtag.js
    // do GA4 é servido em `.../gtag/js?id=G-…`, e uma URL com query string
    // nunca termina em `.js` — o filtro antigo lia 0 bytes de JS com o GA4
    // carregado na tela, em produção, nas nove rotas.
    pagina.on("response", async (r) => {
      if (r.request().resourceType() === "script") bytesJs += Number(r.headers()["content-length"] ?? 0);
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
