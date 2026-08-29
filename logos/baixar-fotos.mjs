/** As fotografias da VITRINE. Baixa do Unsplash, converte para AVIF/WebP em
 *  duas ou três larguras e grava em public/img/f-*.
 *
 *  ═══ O QUE MUDOU EM 28/08/2026 ═══════════════════════════════════════════
 *  Este script já foi o oposto do que é agora. Na direção Solari a fotografia
 *  era PAREDE: entrava em cinza, equalizada para a mesma luminância média, com
 *  teto de pico em 130/255, e pousava a 11-16% de opacidade atrás de tudo. O
 *  pipeline inteiro existia para APAGAR a foto o suficiente para caber
 *  embaixo de texto.
 *
 *  Na direção Janela de Embarque a fotografia é a MATÉRIA da página. Ela não
 *  fica atrás do texto — o texto se afasta dela, ou pousa sobre uma faixa de
 *  proteção com gradiente. Sem par de contraste sobre o pixel cru, todo o
 *  aparato de equalização, ganho e teto de alta deixou de ter função e saiu:
 *  eram três constantes calibradas para um problema que a direção nova não
 *  tem. O que sobrou é o oposto — um leve ganho de saturação, porque foto de
 *  viagem que não tem cor não vende viagem nenhuma.
 *
 *  POR QUE UM SCRIPT E NÃO ARQUIVOS COMMITADOS À MÃO: o asset tem procedência
 *  escrita — id, autor e URL da fonte ficam AQUI. Quem trocar uma foto troca
 *  o id nesta tabela e roda `npm run fotos`; ninguém precisa adivinhar de onde
 *  veio o arquivo que está no repositório.
 *
 *  LICENÇA: Unsplash License — uso comercial liberado, sem atribuição
 *  obrigatória, sem custo. O crédito existe porque a licença pede
 *  ("appreciated") e porque este site aponta a origem de tudo que publica.
 *  Ver https://unsplash.com/license */
import { writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

/** Critérios de escolha, em ordem — os três primeiros são herdados da versão
 *  parede e continuam valendo; o quarto é novo e só existe porque agora a foto
 *  é olhada de frente:
 *  1. Nenhuma marca legível. Descartadas candidatas boas de asa por terem a
 *     pintura da companhia no winglet: não anunciar a concorrente do
 *     fornecedor numa parede institucional.
 *  2. Nenhum rosto identificável em papel de cliente. Pessoa aqui é silhueta
 *     anônima de saguão — modelo de banco posando de cliente satisfeito é a
 *     versão fotográfica do preço inventado que este site recusa.
 *  3. Procedência apontável (Unsplash, id no código).
 *  4. NOVO — sobrevive à COR CHEIA. Na parede o critério era o oposto: a foto
 *     tinha que se ler pela silhueta, porque a cor ia embora. Agora a cor é o
 *     assunto, e a pergunta é se a imagem dá vontade de ir. As cinco daqui já
 *     passavam nas duas leituras; nenhuma precisou ser trocada, só parar de
 *     ser apagada. */
const FOTOS = {
  /* A ABERTURA. É a única com gente e a única em que o assunto é o momento,
     não o lugar: silhuetas contra o janelão de um terminal, esperando embarque.
     Escolhida sobre a vila e sobre a asa de propósito — cartão-postal de
     destino é a imagem que toda agência usa, e a asa mostra o transporte, não a
     viagem. Aqui o que aparece é a expectativa, que é o que o produto vende.
     Sem `autor` escrito à mão: o nome vem do que a API devolve, porque crédito
     digitado é crédito que envelhece calado. */
  saguao: { id: "jhX-rAPVmn0", foco: "50% 48%", papel: "abertura" },

  // Passagens. Asa contra o pôr do sol, com as luzes da cidade lá embaixo.
  // Substituiu a asa anterior (1zOkTNRFBhw), que era Unsplash+ — ver o guarda
  // de licença logo abaixo. O ganho não foi só jurídico: esta chega com o
  // laranja da casa no horizonte e o navy da casa no topo do quadro.
  aer: { id: "zIiJGafQurQ", foco: "50% 52%", papel: "peca" },
  // Hotéis. Noite, piscina acesa: o azul do céu é o --noite e a luz das
  // janelas é o --marca. A primeira do conjunto que nasceu nas duas tintas.
  htl: { id: "4Y7DTHX1ins", foco: "50% 50%", papel: "peca" },
  // Pacotes. Vila costeira em falésia na hora azul, janelas acesas.
  // Substituiu a praia aérea (kmREfhcy5q0), que era livre e ficou boa — e saiu
  // mesmo assim: era sol de meio-dia, a única das cinco fora do crepúsculo, e
  // uma foto no horário errado quebra a coerência que faz o conjunto ler como
  // um site em vez de cinco imagens.
  pct: { id: "NYPbgTuM1m8", foco: "50% 50%", papel: "peca" },
  // Carro. Estrada vazia entrando nas montanhas do deserto ao pôr do sol.
  // Substituiu a estrada do vulcão (xxru6Faa8S4), que era Unsplash+/Getty.
  // O produto é dirigir, não o lugar — e é a única imagem do conjunto com
  // movimento implícito.
  car: { id: "ZkywIYKN3sI", foco: "50% 55%", papel: "peca" },
};

/** ═══ O GUARDA DE LICENÇA ═══════════════════════════════════════════════
 *  Falha o script se a foto for Unsplash+ (`plus`/`premium`), e existe porque
 *  ESTE REPOSITÓRIO JÁ PUBLICOU DUAS. `1zOkTNRFBhw` e `xxru6Faa8S4` ficaram
 *  seis sessões no site: são licença paga, e o que o `urls.raw` devolve delas
 *  vem com a marca d'água "Unsplash+" ladrilhada por cima. Ninguém percebeu
 *  porque na direção anterior a foto entrava em cinza, a 11% de opacidade,
 *  atrás de todo o resto — a marca d'água estava lá o tempo todo, invisível.
 *
 *  A lição não é "olhe as fotos": é que asset com licença errada é o tipo de
 *  erro que só aparece quando já está em produção. Uma linha aqui torna o
 *  descuido impossível, e é mais barata que a checagem visual que falhou. */
const bloqueado = (api) => api.plus || api.premium;
/** As larguras servidas. Duas decisões dentro delas:
 *
 *  A ABERTURA tem três degraus e a peça tem dois, porque a abertura é
 *  `100vw` e a peça nunca passa de ~620px de caixa (a grade da Vitrine é
 *  irregular, e a maior célula fica em 2/3 de um container de 1100). Servir
 *  1920 numa caixa de 620 é pagar quatro vezes a área por pixel que ninguém
 *  vê.
 *
 *  O TETO É 1920 E NÃO 2560: a abertura é o elemento de LCP desta página, e o
 *  orçamento assinado é faixa Captação (LCP ≤ 2.0s). Em 2560 o AVIF da
 *  abertura passava de 200kb e o LCP em 4G simulado ia para 2.6s medidos —
 *  fora do orçamento. Em tela 4K o navegador escala 1920 para cima e a perda é
 *  invisível numa fotografia (seria óbvia num diagrama, que é o caso em que
 *  este teto não serviria). */
const LARGURAS = { abertura: [760, 1280, 1920], peca: [520, 1040] };

/** A razão do recorte, por papel.
 *
 *  ABERTURA em 16:9 e não na razão original: a faixa ocupa ~72vh no desktop e
 *  ~56vh no celular, e o `cover` corta altura em tela estreita. 16:9 é a razão
 *  mais larga que ainda tem corpo vertical suficiente para o corte de celular
 *  não virar uma tira.
 *
 *  PEÇA em 4:5 (retrato) e não em 16:9: numa grade irregular a célula alta é o
 *  que quebra o ritmo de "quatro cards iguais lado a lado", que é exatamente a
 *  silhueta que esta direção veio recusar. Retrato também é a razão em que uma
 *  fotografia de lugar respira — paisagem em célula pequena vira miniatura. */
const RAZAO = { abertura: 16 / 9, peca: 4 / 5 };

/** Ganho de saturação. 1.12 e não 1.4: o objetivo é devolver à foto a cor que
 *  o JPEG do Unsplash já entrega um pouco lavada, não fabricar um pôr do sol
 *  que não estava lá. Acima de ~1.2 o céu da abertura vira ciano de filtro de
 *  rede social, que é a versão colorida do mesmo defeito de "parece template".
 *  Modulate opera em HSL sobre o pipeline linear do sharp. */
const SATURACAO = 1.12;

await mkdir("public/img", { recursive: true });
const creditos = [];
const manifesto = {};

for (const [nome, meta] of Object.entries(FOTOS)) {
  const api = await (await fetch(`https://unsplash.com/napi/photos/${meta.id}`)).json();
  if (!api.urls) throw new Error(`Unsplash não devolveu ${meta.id}`);
  if (bloqueado(api))
    throw new Error(
      `${meta.id} é Unsplash+ (licença paga, e o arquivo vem com marca d'água). ` +
        `Escolha outra em unsplash.com/napi/search/photos filtrando plus:false.`,
    );

  const maior = Math.max(...LARGURAS[meta.papel]);
  /* Baixa em 2400 sempre, e não em `maior`: a peça é recortada em RETRATO
     (4:5) a partir de uma origem em paisagem, e aí quem manda no recorte é a
     altura — pedir 1040 de largura entregaria ~690 de altura para um alvo de
     1300, ou seja, upscale. `fit=max` no Unsplash não amplia, então 2400 é
     teto e não promessa. O custo é tempo de script, uma vez; o arquivo servido
     continua sendo o das LARGURAS. */
  const bruto = Buffer.from(
    await (await fetch(`${api.urls.raw}&w=2400&q=90&fm=jpg&fit=max`)).arrayBuffer(),
  );

  const altura = Math.round(maior / RAZAO[meta.papel]);

  /* O RECORTE, à mão. O `fit: "cover"` do sharp aceita só nove âncoras
     nomeadas (`centre`, `north`, …) — não aceita a porcentagem que o CSS
     aceita em `object-position`, e o foco desta tabela é porcentagem porque
     "38% 55%" na asa é um ponto que nenhuma das nove alcança.
     Então: escala pela dimensão que falta e corta a outra em volta do foco.
     Fazer o corte AQUI e não no CSS é o que garante que o pixel descartado nem
     entre no arquivo — em `object-fit: cover` ele é baixado e jogado fora. */
  const [fx, fy] = meta.foco.split(" ").map((v) => parseFloat(v) / 100);
  const meta0 = await sharp(bruto).metadata();
  const razaoOrigem = meta0.width / meta0.height;
  const razaoAlvo = RAZAO[meta.papel];

  /* Mais larga que a origem → a largura manda e sobra altura para cortar.
     Mais estreita (o retrato das peças) → a altura manda e sobra largura. */
  const escala =
    razaoAlvo > razaoOrigem ? maior / meta0.width : altura / meta0.height;
  const lEsc = Math.round(meta0.width * escala);
  const aEsc = Math.round(meta0.height * escala);
  const trava = (v, teto) => Math.max(0, Math.min(Math.round(v), teto));

  /* Materializado em buffer, e não deixado como pipeline: o sharp aceita um
     resize por pipeline, e encadear o `.resize(largura)` de cada degrau em
     cima deste sobrescreveria o resize do recorte — o extract passaria a
     apontar para fora da imagem ("bad extract area"). Um buffer intermediário
     por foto é o preço de ter o recorte feito uma vez só. */
  const base = sharp(
    await sharp(bruto)
      .resize(lEsc, aEsc)
      .extract({
        left: trava((lEsc - maior) * fx, lEsc - maior),
        top: trava((aEsc - altura) * fy, aEsc - altura),
        width: maior,
        height: altura,
      })
      .modulate({ saturation: SATURACAO })
      .toBuffer(),
  );

  /* A COR DO POSTER. Média da imagem em sRGB, gravada em fotos.ts e pintada
     como `background-color` no container do <img>. Ela é o que aparece entre o
     primeiro quadro e a imagem decodificada: um retângulo na cor da fotografia
     lê como a foto chegando, e um retângulo navy chapado lê como buraco.
     Custa 3 números por foto e resolve o flash sem um byte de JS. */
  const { channels } = await base.clone().stats();
  const [r, g, b] = channels.map((c) => Math.round(c.mean));

  const arquivos = [];
  for (const largura of LARGURAS[meta.papel]) {
    const alt = Math.round(largura / RAZAO[meta.papel]);
    const redim = base.clone().resize(largura, alt);

    /* q34 na peça e q40 na abertura. A abertura é olhada de perto e em tela
       cheia; a peça vive em ~520px de caixa, onde o artefato de AVIF a 34 não
       é distinguível a olho e a diferença de peso é de quase metade. */
    const q = meta.papel === "abertura" ? 40 : 34;
    const avif = await redim.clone().avif({ quality: q, effort: 9 }).toBuffer();
    const webp = await redim.clone().webp({ quality: q + 20 }).toBuffer();

    await writeFile(`public/img/f-${nome}-${largura}.avif`, avif);
    await writeFile(`public/img/f-${nome}-${largura}.webp`, webp);
    arquivos.push(`${largura}: avif ${(avif.length / 1024).toFixed(0)}kb / webp ${(webp.length / 1024).toFixed(0)}kb`);
  }

  manifesto[nome] = {
    papel: meta.papel,
    larguras: LARGURAS[meta.papel],
    razao: RAZAO[meta.papel],
    cor: `rgb(${r} ${g} ${b})`,
  };
  creditos.push({
    nome,
    id: meta.id,
    autor: api.user?.name,
    autorLink: api.user?.links?.html,
    pagina: api.links?.html,
  });
  console.log(`f-${nome}  ${arquivos.join("  ")}  — ${api.user?.name}`);
}

await writeFile("public/img/FOTOS.json", JSON.stringify(creditos, null, 2) + "\n");

/* O manifesto é GERADO, não escrito à mão: largura, razão e cor média são
   propriedades do arquivo produzido aqui. Um `width`/`height` digitado no
   componente é a primeira coisa a divergir quando alguém troca uma foto — e
   width/height errado é CLS, que é a métrica que a direção assinou em 0.05. */
await writeFile(
  "src/data/fotos.ts",
  `/* GERADO por logos/baixar-fotos.mjs — não edite à mão.
   Créditos com autor e link em public/img/FOTOS.json. */

export type Foto = {
  papel: "abertura" | "peca";
  larguras: number[];
  razao: number;
  /** Média da imagem em sRGB. Pintada como background do container enquanto o
      arquivo decodifica — o poster desta direção, e o que impede o flash de
      navy chapado no lugar onde vai entrar uma fotografia colorida. */
  cor: string;
};

export const FOTOS: Record<string, Foto> = ${JSON.stringify(manifesto, null, 2)};

/** Altura do arquivo daquela largura. É conta, não tabela: a razão está no
    manifesto e derivar aqui garante que width/height do <img> nunca divirjam
    do que o encoder produziu. */
export const alturaDe = (nome: string, largura: number) =>
  Math.round(largura / FOTOS[nome].razao);
`,
);

console.log("\npublic/img/FOTOS.json e src/data/fotos.ts reescritos.");
