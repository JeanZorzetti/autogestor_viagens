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
`;
await writeFile("src/data/fotos.ts", ts);

console.log("\ncréditos em public/img/FOTOS.json · foco em src/data/fotos.ts");
