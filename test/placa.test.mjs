// A conta da placa. É o único teste do repositório, e existe porque é a única
// lógica daqui que quebra EM SILÊNCIO: o ciclo das pás está espalhado entre
// tokens em tokens.css, quatro listas em conteudo.ts e quatro tabelas de
// porcentagens em global.css. Mexer num sem refazer os outros não quebra
// build, não quebra tipo e não suja o console — só faz a placa piscar em
// branco ou repetir destino, e ninguém olha o CSS de novo.
//
// `node --test test/*.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ler = (caminho) => readFileSync(caminho, "utf8");

/** Casa `export const PRODUTOS = [...] as const;` com ou sem anotação de tipo
 *  (`: readonly Produto[]`) entre o nome e o `=`. */
const RE_PRODUTOS = /export const PRODUTOS(?:\s*:[^=]+)?\s*=\s*\[([\s\S]*?)\]\s*as const;/;

const seg = (tokens, nome) => {
  const m = tokens.match(new RegExp(`--${nome}:\\s*([\\d.]+)s`));
  assert.ok(m, `token --${nome} não existe em tokens.css`);
  return Number(m[1]);
};

/** Extrai as quatro listas de destino de dentro de PRODUTOS, na ordem em que
 *  aparecem. Lê o texto-fonte (não importa o módulo) porque este é um teste
 *  de conteúdo declarado, não de runtime. */
function listasDeDestino(conteudo) {
  const bloco = conteudo.match(RE_PRODUTOS)?.[1];
  assert.ok(bloco, "não achei PRODUTOS em src/data/conteudo.ts");
  const produtos = [...bloco.matchAll(/codigo:\s*"(\w+)"[\s\S]*?destinos:\s*\[([\s\S]*?)\]/g)];
  assert.ok(produtos.length === 4, `esperava 4 produtos com campo destinos, achei ${produtos.length}`);
  return produtos.map(([, codigo, lista]) => ({
    codigo,
    destinos: [...lista.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
  }));
}

// Nomes de cidade que a lista antiga (DESTINOS, removida) usava. R2 decidiu
// país/região; nenhum destes pode reaparecer nas quatro listas novas.
const CIDADES_PROIBIDAS = ["FORTALEZA", "LISBOA", "PORTO SEGURO", "BUENOS AIRES", "MACEIÓ", "ORLANDO", "GRAMADO", "SANTIAGO"];

test("V1 — objeto e detalhe são únicos entre os quatro produtos (FR-020)", () => {
  const conteudo = ler("src/data/conteudo.ts");
  const bloco = conteudo.match(RE_PRODUTOS)?.[1] ?? "";
  const objetos = [...bloco.matchAll(/objeto:\s*"(\w+)"/g)].map((m) => m[1]);
  const detalhes = [...bloco.matchAll(/detalhe:\s*"(\w+)"/g)].map((m) => m[1]);
  assert.equal(objetos.length, 4, "os quatro produtos precisam declarar `objeto`");
  assert.equal(detalhes.length, 4, "os quatro produtos precisam declarar `detalhe`");
  assert.equal(new Set(objetos).size, 4, `objeto repetido entre produtos: ${objetos.join(", ")}`);
  assert.equal(new Set(detalhes).size, 4, `detalhe repetido entre produtos: ${detalhes.join(", ")}`);
});

test("cada linha do painel gera a coluna de destino a partir do próprio produto (T038)", () => {
  // T006 tinha uma ligação TEMPORÁRIA de uma linha só, que morreu em T038
  // junto com o widget `.destino`: agora as quatro colunas vivem dentro de
  // Linha.astro, uma por produto, geradas da lista dele — não à mão.
  const index = ler("src/pages/index.astro");
  assert.doesNotMatch(index, /class="destino"/, "o widget .destino deveria ter sido removido em T038");
  assert.match(index, /<Linha produto=\{p\} linha=\{i\} \/>/, "a placa precisa gerar as quatro linhas do produto, não à mão");

  const linha = ler("src/components/Linha.astro");
  // A coluna saiu de dentro do Linha.astro em 28/08 e virou o componente
  // ColunaDestino.astro — o mesmo bloco estava escrito 5× (aqui e nos quatro
  // objetos de cabeça de portão), e a gravura precisava entrar em um lugar
  // só. O invariante não mudou: quem gera as pás continua sendo a lista DO
  // PRODUTO, nunca uma lista à mão. Só mudou de arquivo.
  assert.match(linha, /destinos=\{produto\.destinos\}/, "Linha.astro precisa passar a lista do próprio produto para a coluna");
  const coluna = ler("src/components/ColunaDestino.astro");
  assert.match(coluna, /destinos\.map\(\(d, i\) =>/, "ColunaDestino.astro precisa gerar as pás da lista recebida");
  assert.match(coluna, /--i:\$\{i\}/, "cada pá precisa carregar seu índice para o atraso do ciclo");
  assert.match(linha, /href=\{produto\.rota\}/, "a linha do painel precisa apontar para o portão (rota interna), não para a busca");
  assert.doesNotMatch(linha, /target="_blank"/, "a linha do painel não deveria abrir em nova aba — o CTA externo migrou para o bloco 5 do portão");
});

test("V2 — em cada ciclo-N a saída vaza além do slot (a janela nunca fica vazia)", () => {
  const tokens = ler("src/styles/tokens.css");
  const global_ = ler("src/styles/global.css");
  const conteudo = ler("src/data/conteudo.ts");
  const giro = seg(tokens, "pa-giro");
  const listas = listasDeDestino(conteudo);

  for (const { codigo, destinos } of listas) {
    const n = destinos.length;
    const bloco = global_.match(new RegExp(`@keyframes ciclo-${n} \\{([\\s\\S]*?)\\n\\}`))?.[1];
    assert.ok(bloco, `@keyframes ciclo-${n} não existe em global.css (produto ${codigo}, N=${n})`);

    const fatia = 100 / n;
    const fim = Number(bloco.match(/,\s*([\d.]+)% \{\s*\r?\n\s*transform: rotateX\(0\)/)?.[1]);
    assert.equal(+fim.toFixed(3), +fatia.toFixed(3), `ciclo-${n}: o hold termina em ${fim}%, deveria terminar em ${fatia.toFixed(3)}%`);

    const saida = Number(bloco.match(/([\d.]+)% \{\s*\r?\n\s*transform: rotateX\(92deg\)/)?.[1]);
    const ciclo = n * seg(tokens, "pa-parada");
    const giroPct = (giro / ciclo) * 100;
    assert.equal(
      +(saida - fim).toFixed(3),
      +giroPct.toFixed(3),
      `ciclo-${n}: a saída leva ${(saida - fim).toFixed(3)}%, um giro é ${giroPct.toFixed(3)}% deste ciclo`
    );
    assert.ok(saida > fatia, `ciclo-${n}: a saída precisa vazar além do slot, senão a janela pisca em branco`);
  }
});

test("V3 — as quatro tabelas de ciclo conferem com a fórmula (giro% = pa-giro ÷ ciclo × 100)", () => {
  const tokens = ler("src/styles/tokens.css");
  const global_ = ler("src/styles/global.css");
  const conteudo = ler("src/data/conteudo.ts");
  const parada = seg(tokens, "pa-parada");
  const giro = seg(tokens, "pa-giro");
  const listas = listasDeDestino(conteudo);

  for (const { codigo, destinos } of listas) {
    const n = destinos.length;
    const ciclo = n * parada;
    const giroPct = +((giro / ciclo) * 100).toFixed(3);
    const ficaFim = +(100 / n).toFixed(3);
    const saiFim = +(ficaFim + giroPct).toFixed(3);

    const bloco = global_.match(new RegExp(`@keyframes ciclo-${n} \\{([\\s\\S]*?)\\n\\}`))?.[1];
    assert.ok(bloco, `@keyframes ciclo-${n} não existe (produto ${codigo})`);

    const entrada = Number(bloco.match(/\r?\n\s*([\d.]+)%,/)?.[1]);
    assert.equal(entrada, giroPct, `ciclo-${n}: entrada em ${entrada}%, a fórmula pede ${giroPct}%`);

    const fim = Number(bloco.match(/,\s*([\d.]+)% \{\s*\r?\n\s*transform: rotateX\(0\)/)?.[1]);
    assert.equal(fim, ficaFim, `ciclo-${n}: hold até ${fim}%, a fórmula pede ${ficaFim}%`);

    const saida = Number(bloco.match(/([\d.]+)% \{\s*\r?\n\s*transform: rotateX\(92deg\)/)?.[1]);
    assert.equal(saida, saiFim, `ciclo-${n}: saída em ${saida}%, a fórmula pede ${saiFim}%`);
  }
});

test("V4 — os quatro comprimentos são coprimos dois a dois e o ciclo completo dura ≥ 1h (FR-005)", () => {
  const tokens = ler("src/styles/tokens.css");
  const conteudo = ler("src/data/conteudo.ts");
  const parada = seg(tokens, "pa-parada");
  const listas = listasDeDestino(conteudo);
  const comprimentos = listas.map((l) => l.destinos.length);
  assert.equal(new Set(comprimentos).size, 4, `comprimentos precisam ser distintos: ${comprimentos.join(", ")}`);

  const mdc = (a, b) => (b === 0 ? a : mdc(b, a % b));
  for (let i = 0; i < comprimentos.length; i++) {
    for (let j = i + 1; j < comprimentos.length; j++) {
      assert.equal(
        mdc(comprimentos[i], comprimentos[j]),
        1,
        `${comprimentos[i]} e ${comprimentos[j]} não são coprimos`
      );
    }
  }
  const mmc = comprimentos.reduce((a, b) => (a * b) / mdc(a, b));
  const repeticao = mmc * parada;
  assert.ok(repeticao >= 3600, `a combinação se repete em ${repeticao}s — FR-005 pede ≥ 3600s (1h)`);
});

test("V5 — todo destino tem ≤ 12 caracteres, caixa alta, sem cidade e sem repetição na própria lista (FR-007, C1–C4)", () => {
  const conteudo = ler("src/data/conteudo.ts");
  const listas = listasDeDestino(conteudo);
  for (const { codigo, destinos } of listas) {
    assert.ok(destinos.length > 0, `${codigo}: lista de destinos vazia`);
    for (const d of destinos) {
      assert.ok(d.length <= 12, `${codigo}: "${d}" tem ${d.length} caracteres, o teto é 12`);
      assert.equal(d, d.toUpperCase(), `${codigo}: "${d}" precisa estar em caixa alta`);
      assert.doesNotMatch(d, /[^A-ZÀ-Ý -]/, `${codigo}: "${d}" tem pontuação além de hífen/espaço`);
      assert.ok(
        !CIDADES_PROIBIDAS.includes(d),
        `${codigo}: "${d}" é nome de cidade — R2 decidiu só país/região`
      );
    }
    assert.equal(new Set(destinos).size, destinos.length, `${codigo}: nome repetido dentro da própria lista`);
  }
});

/** Tira comentários de bloco e de linha inteira. O teste abaixo precisa olhar
 *  o que é SERVIDO, não o que é explicado — os próprios comentários deste
 *  repositório citam a tarifa de exemplo que eles proíbem. `//` só conta no
 *  começo da linha, senão a regra comeria o `https://` de qualquer URL. */
const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("nenhum preço em lugar nenhum do conteúdo servido", () => {
  // A regra que manda no conteudo.ts: tarifa vive na busca e muda por rota e
  // por data. Um valor de enfeite na primeira tela seria número inventado — e
  // é o defeito que este site declarou não cometer, inclusive no llms.txt.
  const arquivos = [
    "src/data/conteudo.ts",
    "src/pages/index.astro",
    "src/pages/sobre.astro",
    "src/pages/passagens-aereas.astro",
    "src/pages/hoteis.astro",
    "src/pages/pacotes.astro",
    "src/pages/aluguel-de-carro.astro",
  ].filter(existsSync);
  for (const arquivo of arquivos) {
    const achado = semComentario(ler(arquivo)).match(/R\$\s?\d/);
    assert.equal(achado, null, `${arquivo} exibe um preço (${achado?.[0]}); tarifa só na busca`);
  }
});

test("V6 — nenhum preço, hora de voo ou número de voo no BUILD servido (FR-029, FR-030)", { skip: !existsSync("dist") ? "rode `npm run build` antes: V6 lê o dist, não a fonte" : false }, () => {
  const glob = (dir) => {
    let arquivos = [];
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      arquivos = statSync(p).isDirectory() ? [...arquivos, ...glob(p)] : p.endsWith(".html") ? [...arquivos, p] : arquivos;
    }
    return arquivos;
  };
  for (const arquivo of glob("dist")) {
    // O JSON-LD legitimamente tem HH:MM — é o horário de atendimento
    // (`openingHoursSpecification`), não hora de voo. O que este teste guarda
    // é o CONTEÚDO VISÍVEL do painel, então o grafo estruturado sai antes de
    // procurar o padrão de hora de voo.
    const html = ler(arquivo).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
    assert.doesNotMatch(html, /R\$\s?\d/, `${arquivo} serve um preço`);
    assert.doesNotMatch(html, /\b([01]\d|2[0-3]):[0-5]\d\b/, `${arquivo} serve algo no formato HH:MM (hora de voo)`);
    assert.doesNotMatch(html, /\b[A-Z]{2}\s?\d{3,4}\b/, `${arquivo} pode estar servindo número de voo`);
  }
});

test("V7 — todo CTA externo aponta para EXTERNOS.busca, e nenhuma URL de resultado vazio aparece (R1)", () => {
  const consts = ler("src/consts.ts");
  assert.match(consts, /busca: "https:\/\/br\.onertravel\.com\//, "a URL da busca saiu de consts.ts");

  const astros = [];
  const varrer = (dir) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) varrer(p);
      else if (p.endsWith(".astro")) astros.push(p);
    }
  };
  varrer("src/pages");
  varrer("src/components");
  varrer("src/layouts");

  // A MARCA "OnerTravel" pode aparecer em prosa (é o que /sobre, /termos e o
  // rodapé fazem, de propósito — FR-023). O que não pode é o DOMÍNIO escrito à
  // mão: isso seria uma segunda fonte da verdade para a URL de busca.
  const proibidas = /onertravel\.com|flight-list|hotel-list|car-list|combined/i;
  for (const arquivo of astros) {
    const conteudo = semComentario(ler(arquivo));
    assert.doesNotMatch(conteudo, proibidas, `${arquivo}: URL/rota da OnerTravel escrita à mão; use EXTERNOS.busca`);
  }
});

test("V8 — quatro rotas, quatro slugs únicos, sem colisão (FR-015)", () => {
  const conteudo = ler("src/data/conteudo.ts");
  const bloco = conteudo.match(RE_PRODUTOS)?.[1] ?? "";
  const rotas = [...bloco.matchAll(/rota:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(rotas.length, 4, "os quatro produtos precisam declarar `rota`");
  assert.equal(new Set(rotas).size, 4, `slug repetido: ${rotas.join(", ")}`);
  for (const r of rotas) {
    assert.match(r, /^\/[a-z0-9-]+$/, `"${r}" não é um slug válido (minúsculas, hífen, barra inicial, sem barra final)`);
  }

  if (existsSync("dist/sitemap-0.xml")) {
    const sitemap = ler("dist/sitemap-0.xml");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.equal(urls.length, 8, `sitemap tem ${urls.length} URLs, deveria ter 8`);
    assert.ok(!urls.some((u) => u.includes("/404")), "/404 não pode entrar no sitemap");
  }
});
