// Mede os pares de contraste do sistema.
//   node logos/contraste.mjs      (sai com código 1 se algum par reprovar)
//
// Fica FORA do `npm test` de propósito: `npm test` valida lógica, isto valida
// uma decisão de design, e roda quando a paleta muda.
//
// DIFERENÇA EM RELAÇÃO AO MESMO SCRIPT NO SITE DE SEGURO: lá a paleta é
// reescrita em hex dentro do próprio checador, o que cria uma segunda cópia
// que envelhece sozinha — trocar um token no CSS e esquecer de trocar aqui faz
// o script medir uma cor que o site não usa mais, e passar. Aqui os valores
// são LIDOS de src/styles/tokens.css e convertidos de OKLCH para sRGB na hora.
// Existe uma fonte da verdade só.
//
// Um tema só: este site é escuro por decisão de direção (ver o carimbo em
// tokens.css). Não há seletor claro/escuro para medir.
//
// COBERTURA PARCIAL POR CONSTRUÇÃO: este script mede token contra token. O
// texto que corre sobre a fotografia da abertura tem por fundo um pixel, não
// um token, e é medido por logos/contraste-abertura.mjs. Rode os dois.
import { readFileSync } from "node:fs";

// ── OKLCH → sRGB (fórmulas de Björn Ottosson) ───────────────────────────────
const gama = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function oklchParaRgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(255, Math.max(0, Math.round(gama(v) * 255))));
}

// ── lê os tokens do CSS e resolve os aliases var(--x) ───────────────────────
const css = readFileSync("src/styles/tokens.css", "utf8");
const cru = new Map();
for (const [, nome, valor] of css.matchAll(/^\s{2}(--[\w-]+):\s*([^;]+);/gm)) cru.set(nome, valor.trim());

const cache = new Map();
function cor(nome) {
  if (cache.has(nome)) return cache.get(nome);
  let v = cru.get(nome);
  if (!v) throw new Error(`token ${nome} não existe em tokens.css`);
  const alias = v.match(/^var\((--[\w-]+)\)$/);
  if (alias) return cor(alias[1]);
  const ok = v.match(/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/);
  if (!ok) throw new Error(`token ${nome} não é oklch nem alias: ${v}`);
  const rgb = oklchParaRgb(+ok[1], +ok[2], +ok[3]);
  cache.set(nome, rgb);
  return rgb;
}

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const razao = (a, b) => {
  const [x, y] = [lum(cor(a)), lum(cor(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = (n) => "#" + cor(n).map((v) => v.toString(16).padStart(2, "0")).join("");

// [rótulo, frente, fundo, mínimo]
// 4.5 → texto normal · 3 → texto grande e limite de componente interativo
// (WCAG 1.4.11) · 1 → separador puramente decorativo, medido só para registro.
// [rótulo, frente, fundo, mínimo]
// 4.5 → texto normal · 3 → texto grande e limite de componente interativo
// (WCAG 1.4.11) · 1 → separador puramente decorativo, medido só para registro.
//
// ═══ O QUE ESTE ARQUIVO DEIXOU DE MEDIR EM 28/08/2026 ══════════════════════
// A tabela era quatro vezes maior e media a placa Solari: os dois extremos do
// gradiente do painel, as duas metades da pá, o trilho de metal da moldura, o
// vinco. Esses tokens não existem mais — a direção nova não tem painel, nem
// pá, nem vinco — e um par medindo um token morto é um teste que passa sempre.
//
// A superfície de risco mudou de lugar junto com eles. Na Solari todo texto
// vivia sobre uma cor chapada ou um gradiente de tokens, e este script cobria
// o site inteiro. Aqui o texto mais visível da página mora sobre uma
// FOTOGRAFIA, e fotografia não é token: quem mede aquilo é o
// logos/contraste-abertura.mjs, que fotografa a página e varre os pixels.
// Os dois juntos é que fecham a cobertura — nenhum dos dois sozinho.
const PARES = {
  "texto sobre as superfícies de token": [
    ["texto / fundo", "--texto", "--fundo", 4.5],
    ["texto / superfície (a caixa do fecho)", "--texto", "--superficie", 4.5],
    ["texto / superfície-alta (details aberto, hover)", "--texto", "--superficie-alta", 4.5],
    ["texto-2 (corpo secundário) / fundo", "--texto-2", "--fundo", 4.5],
    ["texto-2 / superfície", "--texto-2", "--superficie", 4.5],
    ["texto-2 / superfície-alta", "--texto-2", "--superficie-alta", 4.5],
    ["texto-3 (nota, rótulo, crédito) / fundo", "--texto-3", "--fundo", 4.5],
    ["texto-3 / superfície", "--texto-3", "--superficie", 4.5],
    ["texto-3 / superfície-alta", "--texto-3", "--superficie-alta", 4.5],
  ],
  "marca — o laranja medido das peças de captação": [
    // #f88400 é o laranja exato de "AGORA!" e do botão BUSCAR nas peças de
    // ago/2026 (amostrado em pixel, não aproximado). Sobre o navy ele passa
    // como texto normal; sobre branco daria ~2.4:1. A banda escura é o que
    // acomoda a cor da marca sem clareá-la — não é gosto.
    ["marca (código AER/HTL, link, seta) / fundo", "--marca", "--fundo", 4.5],
    ["marca / superfície", "--marca", "--superficie", 4.5],
    ["marca / superfície-alta", "--marca", "--superficie-alta", 4.5],
    ["marca-alta (link em hover) / fundo", "--marca-alta", "--fundo", 4.5],
    ["marca-alta / superfície", "--marca-alta", "--superficie", 4.5],
  ],
  "o botão": [
    // A cor da marca NÃO é escurecida para passar; quem muda é o texto em cima
    // dela. Mesma manobra do hub e do site de seguro.
    ["tinta-sobre-marca / marca", "--tinta-sobre-marca", "--marca", 4.5],
    ["tinta-sobre-marca / marca-alta (hover)", "--tinta-sobre-marca", "--marca-alta", 4.5],
  ],
  "foco e limite de componente (1.4.11 pede 3, não 4.5)": [
    // O anel de foco sobre o botão laranja seria laranja-sobre-laranja e
    // sumiria — é por isso que --foco é custom property e o .btn--primario a
    // sobrescreve com a tinta escura. Os dois casos estão medidos.
    ["anel de foco / fundo", "--foco", "--fundo", 3],
    ["anel de foco / superfície", "--foco", "--superficie", 3],
    ["anel de foco / superfície-alta", "--foco", "--superficie-alta", 3],
    ["anel de foco DENTRO do botão (tinta) / marca", "--tinta-sobre-marca", "--marca", 3],
    ["borda-forte (contorno do btn) / fundo", "--borda-forte", "--fundo", 3],
    ["borda-forte / superfície", "--borda-forte", "--superficie", 3],
  ],
  "separadores — decorativos, medidos só para registro": [
    ["borda / fundo", "--borda", "--fundo", 1],
    ["borda / superfície", "--borda", "--superficie", 1],
  ],
};

let reprovados = 0;
let total = 0;
for (const [grupo, pares] of Object.entries(PARES)) {
  console.log(`\n${grupo}`);
  for (const [rotulo, frente, fundo, min] of pares) {
    total++;
    const r = razao(frente, fundo);
    const ok = r >= min;
    if (!ok) reprovados++;
    console.log(
      `  ${ok ? "ok  " : "FALHA"} ${r.toFixed(2).padStart(6)}:1  (min ${min})  ${rotulo}  ${hex(frente)} sobre ${hex(fundo)}`
    );
  }
}

console.log(`\n${total} pares medidos, ${reprovados} reprovados.`);
process.exit(reprovados ? 1 : 0);
