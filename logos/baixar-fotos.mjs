/** As fotografias da parede. Baixa do Unsplash, converte para AVIF/WebP e
 *  grava em public/img/foto-*.
 *
 *  POR QUE UM SCRIPT E NÃO SEIS ARQUIVOS COMMITADOS À MÃO: é a mesma regra do
 *  gerar-mapas.mjs. O asset tem procedência escrita — id, autor e URL da
 *  fonte ficam AQUI, não numa planilha. Quem trocar uma foto troca o id nesta
 *  tabela e roda `npm run fotos`; ninguém precisa adivinhar de onde veio o
 *  jpg que está no repositório.
 *
 *  LICENÇA: Unsplash License — uso comercial liberado, sem atribuição
 *  obrigatória, sem custo. O crédito abaixo existe porque a licença pede
 *  ("appreciated") e porque este site não publica material de origem que ele
 *  não consiga apontar. Ver https://unsplash.com/license
 *
 *  A foto é MATÉRIA, não assunto: ela entra na parede a ~11% de opacidade,
 *  dessaturada e tingida de navy. Por isso 1440px de largura e qualidade
 *  baixa bastam — o que sobrevive da imagem é a forma, não o detalhe. */
import { writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

/** Uma foto por rota. O critério de escolha, em ordem:
 *  1. Sobrevive ao duotone — a imagem se lê pela SILHUETA, não pela cor. Foto
 *     que é bonita só por causa do turquesa vira mancha cinza a 11%.
 *  2. Nenhuma marca legível. Descartadas três candidatas boas de asa por
 *     terem a pintura da companhia no winglet: livrar de logo alheio numa
 *     parede institucional não é frescura jurídica, é não anunciar a
 *     concorrente do fornecedor.
 *  3. Nenhum rosto identificável em papel de cliente. Pessoa aqui é silhueta
 *     anônima de saguão — modelo de banco posando de cliente satisfeito seria
 *     a versão fotográfica do preço inventado que este site recusou. */
/** As chaves são as MESMAS de `parede` no Base.astro (`aer`/`htl`/`pct`/`car`,
 *  mais `cap` para a capa). Uma prop escolhe o mapa e a foto juntos, porque é
 *  uma decisão só: é a parede daquele produto. Duas props seriam dois jeitos
 *  de errar a mesma coisa. */
const FOTOS = {
  // NÃO EXISTE FOTO DA CAPA, e a ausência é a decisão de 28/08: a parede da
  // capa é o mapa dos 19 destinos, porque lá a figura é informação. Havia uma
  // candidata escolhida e aprovada para ela (um saguão de terminal, cuja grade
  // de janela é a mesma grade da placa) — o que a tirou não foi o olho, foi a
  // medição: mapa e foto não cabem na mesma parede. Ver tokens.css, --foto-luz.

  // Passagens. Winglet contra céu em gradiente: já é quase a paleta do site,
  // e o vazio dos 2/3 de cima é onde a placa se apoia.
  aer: { id: "1zOkTNRFBhw", autor: "Ivan Shimko", foco: "30% 60%" },
  // Hotéis. Noite: o azul do céu é o --noite e a luz das janelas é o --marca.
  // A única foto do conjunto que já nasce nas duas tintas da casa.
  htl: { id: "4Y7DTHX1ins", autor: "Kim Hyun Woo", foco: "50% 50%" },
  // Pacotes. Aérea de praia — o que sobrevive ao duotone é o RITMO das sombras
  // de palmeira, que lê como listra gravada, não como cartão-postal.
  pct: { id: "kmREfhcy5q0", autor: "Josh Withers", foco: "50% 40%" },
  // Carro. Perspectiva de um ponto de fuga só. Estrada e não paisagem: o
  // produto é dirigir, não o lugar.
  car: { id: "xxru6Faa8S4", autor: "Matteo Vistocco", foco: "50% 55%" },
};

/** 1200 e não 1440, e o desempate não foi o olho: a camada é `cover` numa
 *  janela, dessaturada, a 11% de opacidade e com o grão do site por cima. O
 *  que ela entrega é forma, e forma sobrevive à escala. A 1440 a praia saía
 *  com 86kb — oito vezes o orçamento de figura que esta direção assinou. */
const LARGURA = 1200;

/** Luminância média (0–255) em que TODA foto chega depois da equalização, e o
 *  número saiu de olhar as cinco na tela, não de uma fórmula: em 108 a praia
 *  ainda lia como cartão-postal atrás do texto; em 76 o céu sumia e sobrava um
 *  plano navy chapado, que é exatamente o defeito que esta camada veio
 *  resolver. 92 é onde as cinco leem como a mesma parede.
 *
 *  Mexer aqui é mexer no contraste da página inteira: subir ALVO_MEDIA clareia
 *  o pixel mais claro da parede, que é o lado fraco do par que
 *  logos/contraste-gravura.mjs mede contra --texto-3. Subiu? rode o script. */
const ALVO_MEDIA = 52;

/** Compressão da faixa dinâmica. Ver a conta no comentário do encode. */
const GANHO = 0.72;

/** Teto de luminância (0–255) de qualquer pixel da foto. MEDIDO, não
 *  escolhido: 168 é o valor mais alto em que o pior par da parede
 *  (--texto-3 sobre o pixel mais claro das cinco rotas) ainda mede acima de
 *  4.5:1 no logos/contraste-gravura.mjs. Subir isto sem rodar aquele script é
 *  publicar texto ilegível numa página que tem o número no repositório. */
const TETO_ALTA = 130;

await mkdir("public/img", { recursive: true });
const creditos = [];
let saguao;

for (const [nome, meta] of Object.entries(FOTOS)) {
  const api = await (await fetch(`https://unsplash.com/napi/photos/${meta.id}`)).json();
  if (!api.urls) throw new Error(`Unsplash não devolveu ${meta.id}`);

  const bruto = Buffer.from(
    await (await fetch(`${api.urls.raw}&w=${LARGURA}&q=88&fm=jpg&fit=max`)).arrayBuffer(),
  );

  // O blur de 0.5px é ECONOMIA, não estética: metade dos bits de um AVIF vai
  // para alta frequência (grão do sensor, folha de palmeira, asfalto), e nada
  // disso chega ao olho embaixo de 87% de tinta. Tirando o detalhe, a praia
  // caiu de 86kb para a faixa dos 20 — e a textura que o olho pede volta pelo
  // grão do site, que já roda por cima de tudo.
  const cinza = sharp(bruto).resize(LARGURA).grayscale().blur(0.5);

  // EQUALIZAÇÃO. Esta é a linha que faz cinco fotos diferentes serem a MESMA
  // parede, e ela existe porque a primeira versão não tinha: com um
  // `linear(0.72, 12)` igual para todas, a foto do hotel (noturna, mas cheia
  // de janela acesa) chegava na tela com quase o dobro da luminância média da
  // do céu, e a rota /hoteis lia como página com foto de fundo enquanto as
  // outras quatro liam como parede. A opacidade no CSS é UM número para o
  // site inteiro — é o asset que tem que se ajustar a ele, não o contrário.
  //
  // A conta: `linear(a, b)` faz saida = a·entrada + b. `a` fixo em 0.72
  // comprime a faixa dinâmica de [0,255] para 184 passos (a foto não precisa
  // de preto pleno nem de branco pleno embaixo de 87% de tinta, e faixa curta
  // é um passo a menos para o encoder). `b` sai da média medida de CADA foto,
  // para que todas cheguem em ALVO_MEDIA depois da transformação.
  const { mean } = (await cinza.clone().stats()).channels[0];
  const equalizada = cinza.linear(GANHO, ALVO_MEDIA - GANHO * mean);

  // O TETO DE ALTA. Média igual não é pico igual, e quem reprova no
  // logos/contraste-gravura.mjs é o PICO: o par que a WCAG mede é o pixel mais
  // claro que a parede produz contra --texto-3, e um pixel basta. Com média em
  // 92 e o pico solto, a janela acesa do saguão levava a parede da capa a
  // 3.41:1 — abaixo do 4.5:1 de texto normal.
  //
  // Baixar --foto-luz resolveria o número e apagaria a parede inteira para
  // consertar uns poucos pixels; o mapa gravado, que já vive no limite dele,
  // apagaria junto. `darken` contra um plano chapado é um CLAMP: nenhum pixel
  // passa de TETO_ALTA, e nada abaixo disso é tocado. A foto continua com o
  // mesmo corpo, só perde o estouro que ela não precisava ter.
  const base = sharp(
    await equalizada
      .composite([
        {
          input: { create: { width: LARGURA, height: 1, channels: 3, background: { r: TETO_ALTA, g: TETO_ALTA, b: TETO_ALTA } } },
          tile: true,
          blend: "darken",
        },
      ])
      .toBuffer(),
  );

  const avif = await base.clone().avif({ quality: 34, effort: 9 }).toBuffer();
  const webp = await base.clone().webp({ quality: 55 }).toBuffer();

  await writeFile(`public/img/foto-${nome}.avif`, avif);
  await writeFile(`public/img/foto-${nome}.webp`, webp);

  creditos.push({ nome, ...meta, autorLink: api.user?.links?.html, pagina: api.links?.html });
  console.log(
    `foto-${nome}  avif ${(avif.length / 1024).toFixed(1)}kb  webp ${(webp.length / 1024).toFixed(1)}kb  — ${meta.autor}`,
  );
}

/* ═══ O SAGUÃO ══════════════════════════════════════════════════════════════════════════
   A quinta fotografia, e a única que NÃO é parede.

   As quatro de cima são matéria: entram a 16% atrás de tudo, e o que sobrevive
   delas é forma. Esta é FIGURA — uma faixa em letterbox no topo da primeira
   tela, à luz cheia, olhada de frente. Por isso ela tem pipeline próprio em
   vez de um `if` dentro do laço acima: as duas decisões que definem a parede
   (equalizar todas para a mesma média, e cortar o pico em 130) existem para
   caber embaixo de texto, e aqui não corre texto nenhum por cima. Aplicá-las
   aqui seria apagar a foto para resolver um problema que esta camada não tem.

   O TETO DE CONTRASTE NÃO VALE AQUI, e o motivo é geométrico, não de gosto:
   --foto-luz: 0.16 é o teto da parede porque `--texto-3` corre por cima dela em
   TODA a viewport (ela é `position: fixed`). A faixa do saguão é uma região
   delimitada, sem uma única linha de texto por cima — nem a faixa de status,
   que fica ACIMA dela, no trilho de metal. Sem par de contraste, não há piso a
   respeitar. É a mesma conta de tokens.css com a variável que importa mudada.

   POR QUE ESTA FOTO. É o candidato que o comentário da capa diz ter sido
   escolhido e derrubado pela medição, não pelo olho: a grade de janela do
   terminal é a MESMA grade da placa, o céu já é o --noite e o horizonte já é o
   --marca. Gente aparece só como silhueta anônima de saguão — nenhum rosto
   identificável fazendo papel de cliente satisfeito, que é a regra escrita lá
   em cima e que uma foto de FIGURA tinha toda chance de quebrar. */
/* Sem `autor` escrito à mão: o nome vem do que a API devolve. As quatro de
   cima carregam o nome no código e três delas já divergem do `autorLink` que
   o FOTOS.json gravou — crédito digitado é crédito que envelhece calado. */
const SAGUAO = { id: "jhX-rAPVmn0", foco: "50% 52%" };

/* 1440 e não 1200: esta é a única foto do site que é olhada de perto, e 1440
   é a largura em que a faixa é medida (logos/verificar.mjs). Já foi 1600, pela
   folga de um parallax — o parallax foi cortado (a faixa é a janela, e a
   janela não se mexe: ver o comentário da camada em global.css), então a folga
   virou 160px de largura que ninguém via e que o decodificador pagava no LCP,
   que é justamente o que esta imagem decide. */
const LARGURA_SAGUAO = 1440;

/* O RECORTE. O arquivo é a FAIXA, não a foto: a origem é 16:9 e o `cover`
   jogaria fora quase tudo o que vem nela.

   A RAZÃO SAI DA GEOMETRIA DA FAIXA, e é uma conta, não um gosto. A altura da
   faixa é `calc(23.9vw - 42px)` travada em 302px (tokens.css), então a razão
   largura/altura CRESCE conforme a tela estreita: 4.77:1 em 1440px, 5.5:1 em
   736px, 8.2:1 em 360px. O caso mais QUADRADO é o de 1440, e é ele que decide
   o arquivo: uma imagem em 4.77:1 cobre todas as outras cortando altura, e
   qualquer pixel além disso é pixel que o `cover` descarta em toda largura.

   Isto não é economia de disco, é o LCP: a faixa é o maior elemento pintado da
   primeira tela, então é ELA que a métrica cronometra, e o que a CPU paga é
   decodificar pixel. A primeira versão foi em 3.06:1 e carregava 36% de altura
   que nunca apareceu em tela nenhuma. Medido em 1440×900 com CPU 4× estrangulada:
   mediana de 960ms com o arquivo gordo. */
const RAZAO_FAIXA = 1440 / 302;

/* Onde o recorte se centra, em fração da altura da origem. 0.55 e não 0.50: o
   que precisa sobreviver é a linha do horizonte com as pessoas em pé contra
   ela, e ela fica logo abaixo do meio do quadro. Centrado no meio, a faixa
   pegava vidro e forro. */
const CENTRO_FAIXA = 0.55;

/* Ganho de contraste, e ele é o OPOSTO do que a parede leva. A parede COMPRIME
   (0.72) porque vai para trás de texto; a figura ABRE (1.12) porque a leitura
   dela é a silhueta contra a janela, e silhueta é justamente o que uma curva
   comprimida achata. */
const GANHO_SAGUAO = 1.12;

/* PISO E TETO, e os dois saíram de OLHAR a faixa tingida, não de uma tabela.
   O ganho sozinho jogava a foto contra as duas pontas e as duas doíam:

   · No pé, as silhuetas batiam em 0 e viravam PRETO PURO. Numa página cuja
     regra é que sombra tem matiz (nenhum preto puro sobre objeto azul), a
     faixa entregava o único preto absoluto do site. 12 é onde a silhueta ainda
     lê como recorte e já tem o navy dentro dela.
   · No topo, o céu batia em 255 e a faixa ficava MAIS CLARA QUE A PLACA. A
     placa é o objeto da página; uma parede de fundo que brilha mais que ele
     inverte a hierarquia inteira. 200 é onde o céu ainda é céu e já assenta
     abaixo do painel.

   É o mesmo `darken` contra plano chapado que a parede usa no teto, agora com
   um `lighten` no piso — clamp dos dois lados, nada entre eles é tocado. */
const PISO_SAGUAO = 12;
const TETO_SAGUAO = 200;

/* Os dois extremos do duotone, em sRGB. A conta de por que são estes está no
   comentário do encode, embaixo. */
const SAGUAO_SOMBRA = [18, 28, 56];
const SAGUAO_ALTA = [206, 215, 236];

{
  const api = await (await fetch(`https://unsplash.com/napi/photos/${SAGUAO.id}`)).json();
  if (!api.urls) throw new Error(`Unsplash não devolveu ${SAGUAO.id}`);

  const bruto = Buffer.from(
    await (await fetch(`${api.urls.raw}&w=${LARGURA_SAGUAO}&q=90&fm=jpg&fit=max`)).arrayBuffer(),
  );

  const { height } = await sharp(bruto).metadata();
  const altura = Math.round(LARGURA_SAGUAO / RAZAO_FAIXA);
  /* O `clamp` do topo não é paranoia: se um dia a foto trocar por uma mais
     quadrada, `centro - altura/2` fica negativo e o `extract` estoura com um
     erro do sharp que não diz qual foto é. */
  const topo = Math.max(0, Math.min(height - altura, Math.round(height * CENTRO_FAIXA - altura / 2)));

  /* O DUOTONE SAI DAQUI, E NÃO DO CSS — e esta é a única regra da parede que a
     figura inverte de propósito. Está escrito em tokens.css que quem põe cor é
     o CSS (`color` de --noite-950 sobre a foto cinza, `soft-light` de --marca
     por cima). Isso funciona A 16%, onde o navy do fundo domina a mistura.
     A 100% não funciona, e o próprio comentário de lá já dizia por quê: "a foto
     já vem cinza, o `color` quase não trabalha". Foi medido de novo aqui, com a
     faixa na tela: `mix-blend-mode: luminosity` sobre navy devolvia um céu
     CINZA-LAVANDA quase branco — luminância alta não cabe no croma do navy,
     então a alta escapa para o branco por mais tinta que se ponha. E o
     `soft-light` da marca por cima, na opacidade cheia da figura, lavava a
     faixa inteira de sépia: pôster de agência, que é o risco que esta direção
     assinou por escrito ao escolher a fotografia como figura.

     O que resolve é mapa de gradiente de dois pontos, que é o duotone de
     verdade: cada canal recebe sua própria reta, então L=0 vira NAVY e L=255
     vira o azul-claro do céu, com todo o meio interpolado entre os dois. Sai um
     `linear()` por canal no encoder, zero camada de composição no navegador —
     mais barato que as duas de blend que ele substitui, e é a única forma de a
     sombra da foto ser navy DE VERDADE em vez de preto com tinta por cima.

     OS DOIS EXTREMOS saíram de olhar quatro pares na tela, com a placa montada
     embaixo da faixa em cada um:
       navy → creme .............. quente e pálido; o bege não é tinta da casa
       navy → creme quente ....... sépia; foto antiga, não janela
       navy → âmbar .............. a mais bonita sozinha, e a que mais briga:
                                   o âmbar duela com o --marca do H1 ao lado
       navy → azul-claro ......... o site. É esta.
     E o teto do azul foi escolhido com a placa como régua: em 233,238,252 a
     faixa brilhava MAIS que o painel e invertia a hierarquia da página; em
     182,194,222 as nuvens já tinham apagado. 206,215,236 é onde as duas coisas
     ainda estão de pé.

     A FAIXA É FRIA E ISSO É A DECISÃO, não uma sobra: a janela é o lado de
     fora (frio) e a placa é o objeto (navy com laranja). Forçar o --marca dentro
     da fotografia era o caminho para o pôster; deixar o quente aparecer só no
     que é da casa — o H1, os códigos, o status — é o que faz a faixa ler como
     vidro e não como capa de catálogo. */
  const clampe = (blend, nivel) => ({
    input: { create: { width: LARGURA_SAGUAO, height: 1, channels: 3, background: { r: nivel, g: nivel, b: nivel } } },
    tile: true,
    blend,
  });

  const cinza = await sharp(bruto)
    .extract({ left: 0, top: topo, width: LARGURA_SAGUAO, height: altura })
    .grayscale()
    .linear(GANHO_SAGUAO, 0)
    .composite([clampe("darken", TETO_SAGUAO), clampe("lighten", PISO_SAGUAO)])
    .toBuffer();

  /* A reta de cada canal: saida = ((alta - sombra) / 255) * entrada + sombra.
     Aplicada sobre o cinza JÁ clampado em [12, 200] — o clamp é o que dá
     headroom para o mapa não achatar as nuvens no topo da rampa. */
  const base = sharp(cinza)
    .toColourspace("srgb")
    .linear(
      SAGUAO_ALTA.map((canal, i) => (canal - SAGUAO_SOMBRA[i]) / 255),
      SAGUAO_SOMBRA,
    );

  const avif = await base.clone().avif({ quality: 42, effort: 9 }).toBuffer();
  const webp = await base.clone().webp({ quality: 62 }).toBuffer();

  await writeFile("public/img/saguao.avif", avif);
  await writeFile("public/img/saguao.webp", webp);

  const autor = api.user?.name ?? "(sem nome na API)";
  creditos.push({ nome: "saguao", ...SAGUAO, autor, autorLink: api.user?.links?.html, pagina: api.links?.html });
  saguao = { largura: LARGURA_SAGUAO, altura };
  console.log(
    `saguão      avif ${(avif.length / 1024).toFixed(1)}kb  webp ${(webp.length / 1024).toFixed(1)}kb  ` +
      `${LARGURA_SAGUAO}×${altura} (${(LARGURA_SAGUAO / altura).toFixed(2)}:1) — ${autor}`,
  );
}

await writeFile("public/img/FOTOS.json", JSON.stringify(creditos, null, 2) + "\n");
/* A ponte para o layout, no mesmo formato que gerar-mapas.mjs usa: o
   componente NÃO monta nome de arquivo nem ponto focal em runtime, ele lê uma
   tabela gerada. Assim o ponto focal de cada foto tem uma fonte da verdade só
   — a tabela FOTOS lá em cima — e trocar a foto de uma rota é editar um lugar. */
const ts =
  `/* GERADO por logos/baixar-fotos.mjs — não edite à mão.
   Chave da parede → onde o corte de \`cover\` tem que cair naquela foto.
   Fotografias do Unsplash (licença livre, sem atribuição obrigatória); os
   créditos, com autor e link, ficam em public/img/FOTOS.json. */

export const FOTO_FOCO: Record<string, string> = {
` +
  creditos.map((c) => `  "${c.nome}": "${c.foco}",`).join("\n") +
  `
};

/* As dimensões REAIS do recorte, para os atributos width/height do <img>.
   Quem segura o CLS aqui é a altura fixa do container (--saguao-h, em
   tokens.css), não estes números — mas um <img> que declara um tamanho
   diferente do arquivo é uma mentira no HTML que custa zero para não contar.
   Saem do recorte feito no encoder, não de uma conta à mão que envelhece na
   primeira troca de foto. */
export const SAGUAO = { largura: ${saguao.largura}, altura: ${saguao.altura} } as const;
`;
await writeFile("src/data/fotos.ts", ts);

console.log("\ncréditos em public/img/FOTOS.json · foco em src/data/fotos.ts");
