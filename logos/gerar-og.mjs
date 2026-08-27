// Gera a imagem de compartilhamento (Open Graph) do site.
//   node logos/gerar-og.mjs
//
// Renderiza no NAVEGADOR em vez de montar o PNG no sharp, por um motivo só: a
// fonte. A IBM Plex Mono não está instalada no sistema, então um SVG
// rasterizado pelo sharp cairia numa mono qualquer — e o cartão de
// compartilhamento é justamente onde a marca aparece para quem ainda NÃO
// entrou no site. Aqui a página carrega o MESMO arquivo de fonte que o site
// serve, de public/fonts.
//
// A alternativa (um arquivo de design mantido à mão) foi recusada: é assim que
// um PNG de marca fica desatualizado sem ninguém perceber.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const L = 1200;
const A = 630;
const SAIDA = "public/img/og.png";

// Tokens em hex, copiados de tokens.css (lá eles são OKLCH; aqui o navegador
// resolveria os dois igual, mas hex mantém o script legível). São poucos e
// estáveis — importar CSS de dentro de um script node custaria mais que as
// seis linhas que economizaria.
const FUNDO = "#000d28";
const PLACA = "#00143c";
const BORDA = "#2d3f63";
const LARANJA = "#f88400";
const LARANJA_ALTO = "#ffa640";
const TEXTO = "#eef2fa";
const TEXTO_3 = "#8f9cb5";

// O telefone sai de src/consts.ts, não escrito aqui: um cartão que promete um
// número diferente do que o site mostra é o tipo de divergência que ninguém
// revisa depois que o PNG fica pronto. Regex e não import porque consts.ts é
// TypeScript e este script roda em node cru.
const consts = readFileSync("src/consts.ts", "utf8");
const TELEFONE = consts.match(/telefoneExibicao: "([^"]+)"/)?.[1];
if (!TELEFONE) throw new Error("não consegui ler telefoneExibicao de src/consts.ts");

// A marca inline, do MESMO componente que a página usa — não uma segunda
// cópia. Pega só o <svg> de dentro do .astro e as custom properties do <style>.
const logoAstro = readFileSync("src/components/Logo.astro", "utf8");
const svg = logoAstro.match(/<svg[\s\S]*?<\/svg>/)?.[0];
const vars = [...logoAstro.matchAll(/(--lg-[a-z0-9]+): (#[0-9a-f]{6});/g)]
  .map(([, k, v]) => `${k}:${v}`)
  .join(";");
if (!svg || !vars) throw new Error("não consegui extrair a marca de src/components/Logo.astro");
const marca = svg.replace('class:list={["logo", klass]}', `class="logo" style="${vars}"`).replace(/\{size\}/g, "56");

const fonte = pathToFileURL("public/fonts/plex-mono-600-latin.woff2").href;

// As quatro linhas da placa, as mesmas de src/data/conteudo.ts. Lidas do
// arquivo pelo mesmo motivo do telefone.
const conteudo = readFileSync("src/data/conteudo.ts", "utf8");
const linhas = [...conteudo.matchAll(/codigo: "([A-Z]{3})",\s*\n\s*nome: "([^"]+)"/g)].map(([, c, n]) => [c, n]);
if (linhas.length !== 4) throw new Error(`esperava 4 produtos em conteudo.ts, achei ${linhas.length}`);

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face{font-family:"Plex Mono";font-weight:600;font-display:block;src:url("${fonte}") format("woff2")}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${L}px;height:${A}px;background:${FUNDO};color:${TEXTO};
       font-family:"Plex Mono",monospace;font-weight:600;overflow:hidden;
       display:flex;flex-direction:column}

  /* A FAIXA DE STATUS — o topo da placa, igual ao do site. */
  .faixa{display:flex;align-items:center;gap:18px;padding:26px 56px;
         border-bottom:1px solid ${BORDA};background:${PLACA};
         font-size:19px;letter-spacing:.14em;text-transform:uppercase;color:${TEXTO_3}}
  .faixa .nome{color:${TEXTO};letter-spacing:.1em}
  .faixa .fim{margin-left:auto;color:${LARANJA}}
  .logo{display:block;width:56px;height:56px}

  .corpo{flex:1;padding:38px 56px 0;background:${PLACA}}
  h1{font-size:66px;line-height:1.0;letter-spacing:-.03em;text-transform:uppercase;
     font-variant-ligatures:none}
  h1 em{display:block;font-style:normal;color:${LARANJA}}

  /* O DESTINO — a pá que no site vira sozinha, aqui congelada num valor. Um
     cartão de compartilhamento não anima, então o gesto entra como ele fica
     DEPOIS de travar: é isso que a placa mostra 99% do tempo. */
  .destino{display:flex;align-items:baseline;gap:20px;margin-top:26px;
           padding-top:20px;border-top:1px solid ${BORDA}}
  .destino .rot{font-size:18px;letter-spacing:.14em;text-transform:uppercase;color:${TEXTO_3}}
  .destino .val{font-size:36px;color:${LARANJA_ALTO};letter-spacing:-.01em}

  .linhas{display:flex;gap:0;margin-top:22px;border-top:1px solid ${BORDA}}
  .linhas div{flex:1;padding:14px 0 0;border-right:1px solid ${BORDA}}
  .linhas div:last-child{border-right:0}
  .linhas .cod{font-size:17px;letter-spacing:.08em;color:${LARANJA}}
  .linhas .nom{font-size:19px;color:${TEXTO};margin-top:5px;letter-spacing:-.01em}

  .rodape{display:flex;align-items:center;gap:22px;padding:22px 56px;
          border-top:1px solid ${BORDA};font-size:20px;letter-spacing:.06em;
          text-transform:uppercase;color:${TEXTO_3}}
  .rodape .zap{color:${TEXTO}}
  /* O filete da marca fechando o cartão — a mesma régua laranja que separa as
     seções no site, na espessura que uma miniatura de compartilhamento ainda
     mostra. */
  .emenda{height:5px;background:${LARANJA}}
</style></head><body>
  <div class="faixa">${marca}<span class="nome">Autogestor Viagens</span><span>· GYN Goiânia</span><span class="fim">Busca aberta 24h</span></div>
  <div class="corpo">
    <h1>Pesquise<br>onde quiser.<br><em>Compare aqui.</em></h1>
    <div class="destino"><span class="rot">Destino</span><span class="val">FORTALEZA</span></div>
    <div class="linhas">
      ${linhas.map(([c, n]) => `<div><div class="cod">${c}</div><div class="nom">${n}</div></div>`).join("")}
    </div>
  </div>
  <div class="emenda"></div>
  <div class="rodape"><span>Voo · Hotel · Pacote · Carro</span><span>Até 12x</span><span class="zap" style="margin-left:auto">${TELEFONE}</span></div>
</body></html>`;

mkdirSync("public/img", { recursive: true });
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
await pagina.setContent(html, { waitUntil: "load" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: SAIDA });
await navegador.close();
console.log(`${SAIDA} — ${L}×${A}`);
