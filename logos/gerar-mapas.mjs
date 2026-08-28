/* Gera as figuras da direção CARTOGRAFIA a partir de dado geográfico real.
 *
 * REGRA QUE MANDA NESTE ARQUIVO, e é a mesma de src/data/conteudo.ts: nada
 * aqui é desenhado à mão. Um contorno "parecido com a Argentina" é a versão
 * gráfica do "R$ 1.284 de enfeite" que este site recusou por escrito. Toda
 * forma sai de uma fonte primária:
 *
 *   países      → Natural Earth 1:50m, via world-atlas@2 (countries-50m)
 *   macrorregiões brasileiras → malha oficial do IBGE (API v3 /malhas),
 *                 intrarregiao=regiao — as 5 regiões como o IBGE as define
 *   PATAGÔNIA   → Argentina + Chile recortados ao sul do paralelo 39°S,
 *                 que é a definição corrente (rio Colorado). O recorte é
 *                 geométrico e está declarado, não é um traço a olho.
 *   CARIBE      → união dos 23 territórios insulares do Caribe no 50m
 *   EUROPA      → união dos países da Europa continental + ilhas britânicas
 *
 * SAÍDAS (as três são commitadas; `npm run mapas` só é preciso quando a
 * lista de destinos de conteudo.ts mudar):
 *   src/styles/mapas.css   19 contornos como data-uri, um custom property
 *                          cada, usados via `mask-image` — a cor continua
 *                          vindo dos tokens, não fica congelada no asset
 *   public/img/parede.svg  o mapa-múndi da parede: as 19 formas nas suas
 *                          coordenadas reais + gratícula de 15°
 *   src/data/mapas.ts      a ponte nome-do-destino → nome do custom property
 *
 * PROJEÇÃO. Plate carrée (equirretangular). Na parede, paralelo padrão 0° —
 * é literalmente a projeção do mapa de parede de saguão. Nas figuras
 * individuais, o paralelo padrão é a latitude central da própria forma, para
 * a silhueta ter a proporção correta onde ela está: Portugal na projeção
 * global sairia esticado 40% na horizontal.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const DADOS = resolve(AQUI, "_dados");

const FONTES = {
  mundo: {
    arquivo: resolve(DADOS, "countries-50m.json"),
    url: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
  },
  brasil: {
    arquivo: resolve(DADOS, "br-regioes.json"),
    url: "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=intermediaria&intrarregiao=regiao",
  },
};

async function baixar({ arquivo, url }) {
  if (existsSync(arquivo)) return JSON.parse(readFileSync(arquivo, "utf8"));
  mkdirSync(DADOS, { recursive: true });
  process.stdout.write(`baixando ${url}\n`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} respondeu ${r.status}`);
  const texto = await r.text();
  writeFileSync(arquivo, texto);
  return JSON.parse(texto);
}

/* ── TopoJSON ──────────────────────────────────────────────────────────────
   Decodificado à mão: o formato é delta-encoding sobre uma grade quantizada
   e cabe em 20 linhas. Uma dependência para isso pesaria mais em auditoria
   do que em bytes. */

function arcosAbsolutos(topo) {
  const { scale: s, translate: t } = topo.transform;
  return topo.arcs.map((arco) => {
    let x = 0;
    let y = 0;
    return arco.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * s[0] + t[0], y * s[1] + t[1]];
    });
  });
}

/** Índice negativo `i` significa o arco `~i` percorrido de trás para frente.
 *  O último ponto de um arco é o primeiro do próximo — daí o `slice(1)`. */
function anelDeArcos(indices, arcos) {
  const pts = [];
  for (const i of indices) {
    const arco = i < 0 ? [...arcos[~i]].reverse() : arcos[i];
    pts.push(...(pts.length ? arco.slice(1) : arco));
  }
  return pts;
}

function aneisDaGeometria(geo, arcos) {
  if (geo.type === "Polygon") return geo.arcs.map((a) => anelDeArcos(a, arcos));
  if (geo.type === "MultiPolygon") return geo.arcs.flatMap((p) => p.map((a) => anelDeArcos(a, arcos)));
  return [];
}

function aneisDeGeoJSON(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

/* ── geometria ─────────────────────────────────────────────────────────── */

function bbox(aneis) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const anel of aneis) {
    for (const [x, y] of anel) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function distPerp(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distPerp(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}

/** Douglas-Peucker num anel FECHADO. Rodar direto degenera: o primeiro e o
 *  último ponto coincidem, então a distância perpendicular à "reta" entre
 *  eles é medida contra um ponto, e o anel inteiro colapsa. Corta-se o anel
 *  no ponto mais distante do inicial e simplifica-se as duas metades. */
function simplificarAnel(anel, tol) {
  const pts = anel.length > 1 && anel[0][0] === anel.at(-1)[0] && anel[0][1] === anel.at(-1)[1] ? anel.slice(0, -1) : anel;
  if (pts.length < 8) return pts;
  let idx = 0;
  let max = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  const a = dp([...pts.slice(0, idx + 1)], tol);
  const b = dp([...pts.slice(idx), pts[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

/** Recorte de Sutherland-Hodgman contra um semiplano horizontal.
 *  Só é usado pela PATAGÔNIA, e só porque a definição dela É um paralelo. */
function recortarAoSulDe(anel, lat) {
  const dentro = (p) => p[1] <= lat;
  const cruza = (a, b) => {
    const t = (lat - a[1]) / (b[1] - a[1]);
    return [a[0] + t * (b[0] - a[0]), lat];
  };
  const saida = [];
  for (let i = 0; i < anel.length; i++) {
    const a = anel[i];
    const b = anel[(i + 1) % anel.length];
    if (dentro(a)) {
      saida.push(a);
      if (!dentro(b)) saida.push(cruza(a, b));
    } else if (dentro(b)) {
      saida.push(cruza(a, b));
    }
  }
  return saida;
}

/* ── as 19 formas ──────────────────────────────────────────────────────── */

/** Europa continental + ilhas britânicas. A Rússia fica de fora inteira: a
 *  parte europeia dela não é um país no 50m, e recortá-la nos Urais seria o
 *  único traço arbitrário do arquivo. Declarado, não escondido. */
const EUROPA = [
  "Portugal", "Spain", "France", "Italy", "Germany", "Austria", "Switzerland", "Belgium",
  "Netherlands", "Luxembourg", "Ireland", "United Kingdom", "Denmark", "Norway", "Sweden",
  "Finland", "Estonia", "Latvia", "Lithuania", "Poland", "Czechia", "Slovakia", "Hungary",
  "Slovenia", "Croatia", "Bosnia and Herz.", "Serbia", "Montenegro", "Kosovo", "Albania",
  "North Macedonia", "Greece", "Bulgaria", "Romania", "Moldova", "Ukraine", "Belarus",
  "Iceland", "Malta", "Cyprus", "Andorra", "Monaco", "San Marino", "Liechtenstein",
];

const CARIBE = [
  "Cuba", "Haiti", "Dominican Rep.", "Jamaica", "Puerto Rico", "Bahamas", "Trinidad and Tobago",
  "Barbados", "Saint Lucia", "Grenada", "Dominica", "Antigua and Barb.", "St. Kitts and Nevis",
  "Aruba", "Curaçao", "Cayman Is.", "Turks and Caicos Is.", "British Virgin Is.",
  "U.S. Virgin Is.", "Anguilla", "Montserrat", "St-Martin", "St-Barthélemy",
];

/** TERRITÓRIO CONTINENTAL, declarado — não é um limiar escondido.
 *  Numa silhueta de 3rem, Açores, Madeira, Canárias e Svalbard não são
 *  informação: eles esticam a caixa e empurram o continente para um canto,
 *  e o destino deixa de ser reconhecível. Achado OLHANDO a folha de contato,
 *  não lendo o código — Portugal saíra como três pontos e um selo no canto
 *  superior direito. Janela = [lonMin, lonMax, latMin, latMax]; um anel cujo
 *  centro cai fora dela sai da figura. */
const JANELA = {
  PORTUGAL: [-10, -6, 36.5, 42.5],
  ESPANHA: [-10, 4.5, 35.5, 44],
  EUROPA: [-25, 45, 34, 72],
};

/** codarea da malha do IBGE → o nome que aparece na pá. */
const REGIOES_IBGE = { 1: "NORTE", 2: "NORDESTE", 3: "SUDESTE", 4: "SUL", 5: "CENTRO-OESTE" };

const PAISES = {
  BRASIL: "Brazil", ARGENTINA: "Argentina", CHILE: "Chile", PORTUGAL: "Portugal",
  ESPANHA: "Spain", URUGUAI: "Uruguay", PARAGUAI: "Paraguay", COLÔMBIA: "Colombia",
  PERU: "Peru", MÉXICO: "Mexico", ITÁLIA: "Italy",
};

/* ── montagem ──────────────────────────────────────────────────────────── */

const mundo = await baixar(FONTES.mundo);
const brasil = await baixar(FONTES.brasil);
const arcos = arcosAbsolutos(mundo);

const porNome = new Map();
for (const g of mundo.objects.countries.geometries) porNome.set(g.properties.name, g);

function paisAneis(nome) {
  const g = porNome.get(nome);
  if (!g) throw new Error(`país ausente no 50m: ${nome}`);
  return aneisDaGeometria(g, arcos);
}

/** Ilhas e enclaves microscópicos viram um ponto de sujeira depois da
 *  simplificação. Corta o que mede menos de `fracao` da diagonal da forma
 *  inteira — relativo, nunca absoluto: 0,5° é ruído no Brasil e é o país
 *  inteiro em Barbados. */
function podarAneis(aneis, fracao, janela) {
  if (janela) {
    const [lo0, lo1, la0, la1] = janela;
    const dentro = aneis.filter((a) => {
      const b = bbox([a]);
      const cx = (b.x0 + b.x1) / 2;
      const cy = (b.y0 + b.y1) / 2;
      return cx >= lo0 && cx <= lo1 && cy >= la0 && cy <= la1;
    });
    if (dentro.length) aneis = dentro;
  }
  const total = bbox(aneis);
  const minimo = Math.hypot(total.w, total.h) * fracao;
  const vivos = aneis.filter((a) => {
    const b = bbox([a]);
    return Math.hypot(b.w, b.h) >= minimo;
  });
  return vivos.length ? vivos : aneis;
}

const formas = new Map();

for (const [rotulo, nome] of Object.entries(PAISES)) {
  formas.set(rotulo, podarAneis(paisAneis(nome), 0.02, JANELA[rotulo]));
}

for (const f of brasil.features) {
  const rotulo = REGIOES_IBGE[Number(f.properties.codarea)];
  if (rotulo) formas.set(rotulo, podarAneis(aneisDeGeoJSON(f.geometry), 0.02));
}

formas.set("CARIBE", podarAneis(CARIBE.flatMap((n) => (porNome.has(n) ? paisAneis(n) : [])), 0.022));
formas.set("EUROPA", podarAneis(EUROPA.flatMap((n) => (porNome.has(n) ? paisAneis(n) : [])), 0.02, JANELA.EUROPA));

const patagonia = [...paisAneis("Argentina"), ...paisAneis("Chile")]
  .map((a) => recortarAoSulDe(a, -39))
  .filter((a) => a.length > 3);
formas.set("PATAGÔNIA", podarAneis(patagonia, 0.03));

/* ── emissão ───────────────────────────────────────────────────────────── */

const arred = (n, casas) => Number(n.toFixed(casas)).toString();

function paraPath(aneis, casas) {
  return aneis
    .map((a) => `M${a.map(([x, y]) => `${arred(x, casas)} ${arred(y, casas)}`).join("L")}Z`)
    .join("");
}

/** Uma figura sozinha: paralelo padrão na própria latitude central, e a
 *  forma normalizada para caber num viewBox de 100 de largura. */
function figura(aneis, tol, casas) {
  const bb = bbox(aneis);
  const k = Math.cos((((bb.y0 + bb.y1) / 2) * Math.PI) / 180);
  const proj = aneis.map((a) => a.map(([lon, lat]) => [lon * k, -lat]));
  const p = bbox(proj);
  /* Normaliza pelo MAIOR lado, não pela largura. Pela largura, o Chile — que
     mede 1:15 — virava um viewBox de 1500 de altura, e a tolerância de
     simplificação, que é absoluta nesse espaço, ficava fina demais: 10kb de
     path para uma silhueta de 3rem. */
  const escala = 100 / Math.max(p.w, p.h);
  const posto = proj.map((a) => a.map(([x, y]) => [(x - p.x0) * escala, (y - p.y0) * escala]));
  /* A tolerância acompanha o MENOR lado, não é uniforme. Uniforme, ela é
     medida contra a caixa normalizada (100 no maior lado) e destrói o que é
     estreito: o Chile mede 7 unidades de largura, e 1,8 de tolerância nele é
     26% da peça — virava uma barra reta, que é uma mentira sobre a forma.
     Achado na folha de contato, não no código. */
  const menor = Math.min(p.w, p.h) * escala;
  const tolReal = tol * Math.min(1, Math.max(0.22, menor / 100));
  const simples = posto.map((a) => simplificarAnel(a, tolReal)).filter((a) => a.length > 2);
  return {
    d: paraPath(simples, casas),
    w: Number((p.w * escala).toFixed(2)),
    h: Number((p.h * escala).toFixed(2)),
  };
}

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

/* 1 · src/styles/mapas.css — um custom property por forma.
      CAMPO REBAIXADO + ARESTA, e não um fio só: o interior sai PRETO a 42% e
      o contorno BRANCO a 30%, e a figura entra como camada de MISTURA
      (`background-blend-mode: soft-light`) sobre o degradê da pá. É a física
      de um sulco sob a luz de 200°: o fundo do rebaixo recebe menos luz que a
      face, a quina recebe mais. Preto e branco não são cores da paleta aqui —
      são ESCURECER e CLAREAR: quem decide o matiz continua sendo o token da
      pá embaixo, então a gravura obedece à cor da peça sem congelá-la no
      asset e sem custar um elemento, uma máscara ou um filtro.
      O campo cheio ainda resolve de graça a PATAGÔNIA: Argentina e Chile ao
      sul de 39°S se encostam, e dois campos vizinhos leem como uma massa só
      em vez de dois retângulos colados. */
const linhas = [];
const pontas = [];
for (const [rotulo, aneis] of formas) {
  const f = figura(aneis, Number(process.env.TOL_PA ?? 1.8), 1);
  const svg =
    `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 ${(f.w + 2).toFixed(2)} ${(f.h + 2).toFixed(2)}'%3E` +
    `%3Cpath d='${f.d}' fill='%23000' fill-opacity='0.42' fill-rule='evenodd' ` +
    `stroke='%23fff' stroke-opacity='0.30' stroke-width='1.2' stroke-linejoin='round'/%3E%3C/svg%3E`;
  linhas.push(`  --mapa-${slug(rotulo)}: url("data:image/svg+xml,${svg}");`);
  pontas.push(`  ${JSON.stringify(rotulo)}: "--mapa-${slug(rotulo)}",`);
}

const css = `/* GERADO por logos/gerar-mapas.mjs — não edite à mão.
   19 contornos reais (Natural Earth 1:50m + malha oficial do IBGE), cada um
   normalizado num viewBox de 100 de largura. São MÁSCARAS: o traço sai branco
   e quem dá cor é o token da superfície que os usa, para a gravura obedecer à
   mesma fonte de luz de 200° que o resto do site.

   Custo medido: ver o bloco "custo" da entrada desta direção em .art/log.json. */

:root {
${linhas.join("\n")}
}
`;
writeFileSync(resolve(RAIZ, "src/styles/mapas.css"), css);

/* 2 · public/img/parede.svg — as 19 formas nas coordenadas de verdade.
      Paralelo padrão 0°: é o mapa de parede do saguão, não uma figura. */
/** A parede: a gratícula e os contornos nas coordenadas de VERDADE (plate
 *  carrée, paralelo padrão 0° — a projeção do mapa de parede de saguão). A
 *  espessura do traço é relativa à largura do viewBox e não absoluta: senão a
 *  do portão do carro, que enquadra só o Brasil, sairia 4× mais grossa que a
 *  da capa. */
function paredeDe(aneisMundo, passo) {
  const TOL_PAREDE = Number(process.env.TOL_PAREDE ?? 0.8);
  const bb = bbox(aneisMundo);
  const M = 2;
  const vbx = bb.x0 - M;
  const vby = -bb.y1 - M;
  const vbw = bb.w + M * 2;
  const vbh = bb.h + M * 2;
  const grade = [];
  for (let lon = Math.ceil(vbx / passo) * passo; lon <= vbx + vbw; lon += passo) {
    grade.push(`M${lon} ${arred(vby, 2)}V${arred(vby + vbh, 2)}`);
  }
  for (let lat = Math.ceil(vby / passo) * passo; lat <= vby + vbh; lat += passo) {
    grade.push(`M${arred(vbx, 2)} ${lat}H${arred(vbx + vbw, 2)}`);
  }
  const tracos = aneisMundo
    .map((a) => simplificarAnel(a.map(([lon, lat]) => [lon, -lat]), TOL_PAREDE))
    .filter((a) => a.length > 2);
  /* SULCO DE DOIS FIOS, o mesmo truque do vinco da pá: a fresta escura e, um
     fio abaixo dela, a quina clara. Não é enfeite — é o que permite a parede
     ser LIDA gastando pouco claro, e o claro aqui é um recurso escasso:
     --texto-3 corre por cima da parede em .rivais, .ficha__rotulo e
     .detalhe, e um fio branco a 13% derrubava esse par para 3,87:1, abaixo do
     piso de 4,5 (medido em logos/contraste-gravura.mjs, não estimado).

     O TETO do fio claro é 0,44 × --parede-luz ≈ 5,7% de branco. O fio ESCURO
     não tem teto: escurecer o fundo AUMENTA o contraste do texto, então é
     dele que vem quase toda a leitura da gravura.

     O caminho é escrito UMA vez em <defs> e usado duas — o par dobrava o
     arquivo, e `<use>` custa 30 bytes. */
  const fio = arred(vbw * 0.0021, 3);
  const desloc = arred(vbw * 0.0016, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${arred(vbx, 2)} ${arred(vby, 2)} ${arred(vbw, 2)} ${arred(vbh, 2)}">
<!-- GERADO por logos/gerar-mapas.mjs. Contorno real, gratícula de ${passo}°. -->
<defs><path id="c" d="${paraPath(tracos, 2)}"/><path id="g" d="${grade.join("")}"/></defs>
<g fill="none" stroke-linejoin="round">
<use href="#g" stroke="#000" stroke-width="${arred(vbw * 0.0014, 3)}" stroke-opacity="0.55" y="${desloc}"/>
<use href="#g" stroke="#fff" stroke-width="${arred(vbw * 0.001, 3)}" stroke-opacity="0.26"/>
<use href="#c" stroke="#000" stroke-width="${fio}" stroke-opacity="0.96" y="${desloc}"/>
<use href="#c" stroke="#fff" stroke-width="${fio}" stroke-opacity="0.44"/>
</g>
</svg>
`;
}

/* A parede da CAPA: os 19 lugares que esta busca alcança, e nenhum a mais. Um
   mapa-múndi inteiro aqui seria decoração; isto é a cobertura do produto, e
   por isso é informação. */
const parede = paredeDe([...formas.values()].flat(), 15);
writeFileSync(resolve(RAIZ, "public/img/parede.svg"), parede);

/* A parede de CADA PORTÃO: a cobertura daquele produto só. É isto que varia
   entre os quatro (FR-020 aplicado à figura — o portão do carro enquadra o
   Brasil em cinco regiões, o da passagem enquadra três continentes). As
   listas são LIDAS de src/data/conteudo.ts: uma fonte, dois usos, a mesma
   regra que já vale para a pá. test/mapas.test.mjs falha se divergirem. */
const fonteConteudo = readFileSync(resolve(RAIZ, "src/data/conteudo.ts"), "utf8");
const porProduto = new Map();
for (const m of fonteConteudo.matchAll(/codigo:\s*"(AER|HTL|PCT|CAR)"[\s\S]*?destinos:\s*\[([\s\S]*?)\]/g)) {
  porProduto.set(m[1], [...m[2].matchAll(/"([^"]+)"/g)].map((d) => d[1]));
}
if (porProduto.size !== 4) throw new Error(`li ${porProduto.size} listas de destino em conteudo.ts, esperava 4`);

const paredes = { parede };
for (const [codigo, lista] of porProduto) {
  const aneis = lista.flatMap((d) => {
    const f = formas.get(d);
    if (!f) throw new Error(`destino sem forma: ${d}`);
    return f;
  });
  const nome = `parede-${codigo.toLowerCase()}`;
  paredes[nome] = paredeDe(aneis, 15);
  writeFileSync(resolve(RAIZ, `public/img/${nome}.svg`), paredes[nome]);
}

/* 3 · src/data/mapas.ts — a ponte. O componente não faz slug em runtime. */
const ts = `/* GERADO por logos/gerar-mapas.mjs — não edite à mão.
   Nome do destino (como ele aparece na pá) → custom property do contorno.
   Um destino sem entrada aqui é um destino sem figura, e o teste falha. */

export const MAPA_DE: Record<string, string> = {
${pontas.join("\n")}
};
`;
writeFileSync(resolve(RAIZ, "src/data/mapas.ts"), ts);

const kb = (s) => (Buffer.byteLength(s, "utf8") / 1024).toFixed(1);
console.log(`formas: ${formas.size}`);
console.log(`src/styles/mapas.css`.padEnd(27) + `${kb(css).padStart(5)}kb`);
for (const [nome, svg] of Object.entries(paredes)) {
  console.log(`public/img/${nome}.svg`.padEnd(27) + `${kb(svg).padStart(5)}kb`);
}
console.log(`src/data/mapas.ts`.padEnd(27) + `${kb(ts).padStart(5)}kb`);
