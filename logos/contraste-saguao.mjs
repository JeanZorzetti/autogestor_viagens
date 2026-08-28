/* PROVA DA FAIXA. A camada do saguão dispensa o teto de --foto-luz (0.16) com
   um argumento geométrico: ao contrário da parede, que é `fixed` cobrindo a
   viewport e tem `--texto-3` correndo por cima em toda parte, não corre texto
   nenhum sobre a faixa. Enquanto isso for verdade não há par de contraste a
   respeitar e a fotografia pode ser vista; no minuto em que alguém puser uma
   linha de texto ali, o teto volta a valer e a faixa fica ilegal.
   
   Uma invariante dessas não se assume, se mede — e por isso ela mora num
   script e não num comentário. Rode com `npm run contraste-saguao`.

   O QUE CONTA COMO SOBREPOSIÇÃO: texto cujo retângulo cruza a faixa E que não
   tenha nenhuma superfície OPACA entre ele e ela. O link de "Pular para o
   conteúdo", focado, encosta 1px no topo da faixa em três larguras — e não é
   problema, porque ele carrega `background: var(--marca)` sólido: o texto está
   sobre o laranja, que o logos/contraste.mjs já mede. Checar só a geometria
   dava três falsos positivos; é a cadeia de fundos que decide. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
const T = { ".html":"text/html;charset=utf-8", ".css":"text/css", ".woff2":"font/woff2", ".png":"image/png", ".svg":"image/svg+xml", ".avif":"image/avif", ".webp":"image/webp" };
const srv = createServer(async (q, r) => {
  const c = decodeURIComponent(q.url.split("?")[0]);
  for (const t of [c, c + ".html", join(c, "index.html")]) {
    try { const f = join(".vercel/output/static", normalize(t)); const b = await readFile(f);
      r.writeHead(200, { "content-type": T[extname(f)] ?? "application/octet-stream" }); return r.end(b); } catch {}
  }
  r.writeHead(404); r.end();
});
await new Promise((r) => srv.listen(4407, r));
const nav = await chromium.launch();
let falhas = 0;
for (const [w, h] of [[360, 640], [360, 780], [736, 1024], [1440, 900], [1920, 1080]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4407/", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  for (const foco of [false, true]) {
    if (foco) await p.keyboard.press("Tab");           // revela o link de pular
    const r = await p.evaluate(() => {
      const faixa = document.querySelector(".saguao").getBoundingClientRect();
      const cruza = [];
      /* Sobe a cadeia até a faixa procurando um fundo sólido. Alfa 1 basta:
         uma superfície opaca entre o texto e a foto significa que o par de
         contraste daquele texto é com ELA, não com a fotografia. */
      const protegido = (el) => {
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg === "transparent" || bg === "rgba(0, 0, 0, 0)") continue;
          /* Qualquer cor declarada conta, MENOS a que é explicitamente
             translúcida. Não dá para checar só `rgba(...)`: os tokens deste
             site são OKLCH, e o Chromium devolve `oklch(...)` literal no
             computed style — foi o que fez esta prova acusar três falsos
             positivos no link de pular, que tem --marca sólido de fundo. */
          const alfa = bg.match(/[/,]\s*([0-9.]+)\s*\)$/);
          if (!alfa || Number(alfa[1]) === 1) return true;
        }
        return false;
      };
      const anda = (n) => {
        for (const f of n.childNodes) {
          if (f.nodeType === 3 && f.textContent.trim()) {
            if (protegido(f.parentElement)) continue;
            const rg = document.createRange(); rg.selectNodeContents(f);
            for (const b of rg.getClientRects()) {
              if (b.width && b.height && b.top < faixa.bottom && b.bottom > faixa.top &&
                  b.left < faixa.right && b.right > faixa.left)
                cruza.push(`"${f.textContent.trim().slice(0, 34)}" em ${Math.round(b.top)}–${Math.round(b.bottom)}`);
            }
          } else if (f.nodeType === 1 && getComputedStyle(f).visibility !== "hidden") anda(f);
        }
      };
      anda(document.body);
      return { faixa: [Math.round(faixa.top), Math.round(faixa.bottom)], cruza };
    });
    const rot = `${w}×${h}${foco ? " (link de pular focado)" : ""}`;
    if (r.cruza.length) { falhas++; console.log(`✗ ${rot}: faixa ${r.faixa.join("–")} — texto por cima: ${r.cruza.join(" | ")}`); }
    else console.log(`✓ ${rot}: faixa ${r.faixa.join("–")} — nenhum texto sobre ela`);
  }
  await ctx.close();
}
console.log(falhas ? `\n${falhas} sobreposição(ões) — o teto de contraste da parede volta a valer` : "\nG22 sobre a faixa: fechado por medição");
await nav.close(); srv.close();
process.exit(falhas ? 1 : 0);
