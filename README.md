# Autogestor Viagens — site da vertical de turismo

Site em `viagens.roilabs.com.br`, operado pelo **Grupo Autogestor** (Goiânia/GO,
desde 2004). Terceira vertical a sair do hub `autogestor` (`C:\dev\autogestor`)
para domínio próprio, depois do `coopluz` e do `seguros`.

## Rodando localmente

```powershell
npm install
npm run dev
```

Não há variável de ambiente para exportar em desenvolvimento — este site não
fala com banco nenhum (veja abaixo). Em produção só existe `SITE_URL`.

```bash
npm test          # node --test test/*.test.mjs — conteúdo e fotografia
npm run build
npm run check     # astro check (tipos) — 0 erros
npm run contraste          # 24 pares de TOKEN contra token; falha com código 1
npm run contraste-abertura # 698 pares de texto sobre FOTOGRAFIA (ver abaixo)
npm run verificar          # prova no navegador: 4 larguras × 4 rolagens, hover,
                           # teclado, reduced-motion, transição, LCP/CLS
npm run fotos     # rebaixa as 5 fotografias do Unsplash (ver abaixo)
node logos/gerar-og.mjs   # regera a imagem de compartilhamento
```

**Os dois checadores de contraste não são redundância, e rodar só um deixa
metade do site sem medida.** `contraste.mjs` mede token contra token e cobre
tudo que pousa sobre uma superfície de cor. `contraste-abertura.mjs` cobre o
que pousa sobre uma FOTOGRAFIA — onde o fundo não é um token, são pixels que
mudam a cada troca de imagem, de `object-position` ou de `--vidro-*`.

**Verificar tela é sobre o build, não sobre o dev server.** O `astro dev`
injeta a barra de ferramentas do Astro: DOM extra e ~1,8 MB de JavaScript que
não existem em produção. `logos/verificar.mjs` sobe um servidor estático em
cima de `.vercel/output/static` justamente por isso — rode `npm run build`
antes.

## Decisões que não são óbvias no código

**Não existe banco, não existe `/api/lead`, não existe `pg`.** Esta é a única
das seis frentes que é *self-service*: a compra acontece inteira na busca da
OnerTravel, então não há o que captar. O hub e o site de seguro têm um endpoint
dinâmico para gravar lead em `crm_leads`; aqui a página é 100% estática. Nada
de `DATABASE_URL`, nada de função serverless, nada de cold start. Se um dia a
vertical passar a captar, o caminho é copiar o endpoint do `seguros` — não
inventar outro.

**A paleta não foi inventada, foi amostrada em pixel.** As quatro peças de
captação de ago/2026 (`docs/viagens/` do hub) foram lidas com Pillow por região
do lockup: navy `#00143c`, laranja `#f88400`, azul do hexágono `#144880`.
Comparar com o site de seguro é o ponto: lá o laranja é `#fb7402` (matiz ~27°),
aqui é `#f88400` (~32°). São peças diferentes, medidas diferentes — os dois
sites irmãos não nasceram com a mesma tinta por acaso nem por preguiça.

**A marca é copiada do hub, não regerada.** `src/components/Logo.astro` traz a
geometria de `src/components/Logo.astro` do hub, que saiu de
`logos/gerar-logo.py` lá. É a mesma marca da casa; redesenhá-la aqui criaria
uma segunda versão para divergir. A única diferença é que os gradientes
perderam o `light-dark()` — este site tem uma banda só.

**A direção é "Janela de Embarque" (luz · scroll · escura).** A página é uma
janela: do outro lado dela há um lugar, fotografado à hora azul e em cor cheia;
deste lado há o metal do peitoril, onde o texto pousa. O verbo é **abrir** —
uma máscara descobre a imagem — e ele aparece nas quatro camadas:

| camada | onde |
|---|---|
| entrada | a lâmina de texto sobe por uma fresta (`overflow: hidden` no pai) |
| scroll | cada peça é revelada pela mesma máscara, via `animation-timeline: view()` nativo |
| ponteiro | o véu da peça recua e a fotografia cresce dentro da moldura parada |
| transição | a fotografia do produto atravessa da vitrine para a abertura do portão |

Não há fade em lugar nenhum: janela não desbota, janela abre.

**Esta direção substituiu uma anterior, e o registro importa.** Até 28/08/2026
o site era uma PLACA DE EMBARQUE ("Solari"): navy chapado do topo ao rodapé,
monoespaçada em todos os títulos, uma pá girando como motor, e a fotografia
entrando a 11-16% de opacidade, em cinza, atrás de tudo. Seis sessões
empilharam camadas sobre ela — volume, gravura de mapa, foto-parede, uma faixa
de saguão.

Ela foi recusada inteira pelo dono, e o diagnóstico é o mesmo que a recusa: a
tela vendia viagem com estética de **sala de controle**. Estava tudo medido e
não dava vontade de ir a lugar nenhum. O que mudou de fundo não foi a paleta —
é a mesma tinta — foi **quem é a figura**: a fotografia virou a matéria, e a
geometria recuou para moldura. O histórico completo, com eixos e armadilhas,
está em `.art/log.json`.

**A monoespaçada não sumiu, desceu de posto.** Ela mandava em todos os títulos
e era metade do que fazia um site de viagem parecer um terminal. Hoje marca só
o que é código — IATA, rótulo de ficha, numeração de seção — que é onde largura
fixa é informação e não figurino. Os títulos são Instrument Serif, 20,5kb, um
peso. Salto do corpo ao H1 da abertura: 5,2x.

**O LCP é a fotografia, e a direção assume isso por escrito.** O manifesto de
custo está no topo de `src/styles/tokens.css` com números medidos, não
estimados. A regra que continua valendo é a outra: **elemento de LCP não entra
na coreografia** — o H1 e a imagem da abertura já estão no primeiro quadro, e o
que chega pela fresta é a lâmina de texto abaixo deles.

**A macroestrutura é a Vitrine.** Os quatro produtos são fotografias numa grade
irregular (`7fr / 5fr`, invertida na segunda linha, com desalinhamento
vertical), e a peça inteira é o link — não há botão dentro dela. A razão segue
a COLUNA, não a ordem do HTML: quem está na coluna larga deita (5:4), quem está
na estreita fica em pé (4:5). Grade simétrica não é decisão.

A nav continua sendo uma linha sobre a imagem (não uma barra de 4 links com
botão à direita) e o rodapé continua sendo uma linha só (não um bloco de 4
colunas), porque o site tem quatro páginas.

**As páginas internas não encenam a janela.** `/sobre`, `/privacidade` e
`/termos` usam `.doc`, um documento simples, sem fotografia. Uma imagem
decorativa numa política de privacidade é o tipo de enfeite que esta direção
recusa; o que elas herdam é a tipografia e a banda.

**O texto pousa sobre a foto, e o véu que permite isso é calibrado, não
escolhido.** São dois gradientes sobrepostos — o vertical (a janela: limpa em
cima, fechada no peitoril) e o horizontal (a lâmina atrás da coluna de texto,
que some antes dos 74% para a imagem ficar acesa à direita) — mais uma verga em
pixels para a faixa de navegação, mais um conjunto separado de valores para o
celular, onde não existe "o outro lado" para preservar.

`npm run contraste-abertura` fotografa a página com o texto escondido e varre
os pixels sob cada linha, em 5 rotas x 4 larguras x 2 estados (repouso e
**hover** — a camada de ponteiro recua o véu, então o pior fundo que aquele
texto vê é o de hover). 698 pares. O procedimento de calibração dos três
valores do celular está comentado em `tokens.css`: apertar até zerar, afrouxar
até quase reprovar.

**Sobre fotografia não existe texto secundário.** A regra que fechou os últimos
seis pares, e que vale mais que eles: a escala `--texto / -2 / -3` hierarquiza
por luminância, e luminância só hierarquiza contra fundo estável. Sobre uma
imagem, o degrau que no navy lê como "isto é secundário" vira "isto está
apagado". Dentro do peitoril e da faixa a escala colapsa no valor alto, e a
hierarquia passa a ser tamanho e família. Fora dali a escala de três degraus
segue inteira.

**Contraste é medido, não estimado, e o checador lê o CSS.** `npm run
contraste` roda 24 pares e falha com código 1. Diferente do mesmo script no
site de seguro, ele **não tem uma cópia da paleta em hex**: lê `tokens.css`,
resolve os aliases `var()` e converte OKLCH -> sRGB na hora. Uma fonte da
verdade só.

Ele pegou um defeito antes de a página existir: a borda do botão de contorno
dava **2.32:1**, abaixo do 3:1 que a WCAG 1.4.11 exige para limite de
componente interativo. Daí `--noite-600` estar em `L 0.505` e não em `0.44`. O
anel de foco tem a mesma armadilha e a mesma solução do hub: sobre o botão
laranja um anel laranja daria 1.0:1 e sumiria, então `--foco` é custom property
e o `.btn--primario` a troca pela tinta escura do próprio rótulo (7.19:1).

**As cinco fotografias estão todas na hora azul, e isso não é acaso.** É o que
faz o conjunto ler como um site em vez de cinco imagens: o navy da marca não
está *atrás* delas, ele é a continuação delas. Uma praia de sol a pino foi
descartada por esse motivo, mesmo sendo livre e bonita.

`npm run fotos` baixa do Unsplash, recorta em volta de um foco declarado,
converte para AVIF/WebP em duas ou três larguras e **gera** `src/data/fotos.ts`
com largura, razão e a cor média de cada arquivo (o poster). Nada disso é
digitado à mão: `width`/`height` escritos no componente são a primeira coisa a
divergir quando alguém troca uma foto, e divergir ali é CLS.

**Duas fotos ilegais ficaram publicadas seis sessões, e ninguém viu.** Ao
acender a primeira imagem em cor cheia apareceu uma marca d'água "Unsplash+"
ladrilhada: a asa e a estrada eram licença paga. Estavam invisíveis porque
entravam a 11% em cinza atrás de tudo. Foram substituídas por equivalentes
livres, e `logos/baixar-fotos.mjs` agora **falha o download** se a foto for
`plus`/`premium`. A lição não é "olhe as fotos": é que asset com licença errada
só aparece quando já está em produção, e uma linha de guarda é mais barata que
a checagem visual que falhou.

**O enquadramento é decisão da PÁGINA, não do arquivo.** O arquivo é 4:5. A
grade mostra as peças da coluna larga em 5:4 e a abertura do portão mostra a
mesma imagem em ~2,6:1 — o `object-fit: cover` corta de novo, em cada uma. Por
isso existem duas tabelas de `--foco-foto` (uma em `index.astro`, outra em
`CabecaDePortao.astro`) com valores diferentes para a mesma foto. Sem elas, o
portão de aluguel de carro abria com um borrão de nuvem e a estrada ficava fora
do quadro.

**Nenhuma fotografia mostra rosto identificável, marca de companhia, preço ou
horário.** Pessoa aqui é silhueta anônima de saguão — modelo de banco posando
de cliente satisfeito seria a versão fotográfica do preço inventado que este
site recusa. Os critérios estão na tabela de `logos/baixar-fotos.mjs`, e há
teste que falha se um `R$` aparecer no conteúdo servido.

**O site não exibe preço em lugar nenhum, e isso é declarado.** Tarifa vive na
busca da OnerTravel e muda por rota, por data e por hora. Está dito na primeira
tela, em `/sobre`, nos Termos, no rodapé e — em maiúsculas — no `llms.txt`,
para um motor de resposta não preencher a lacuna sozinho.

**O órfão da vitrine é resolvido em CSS, não em JavaScript.** A vitrine declara
quatro `view-transition-name` e o portão de destino declara um; os outros três
ficam sem par, e o navegador resolve órfão com o fade padrão dele — três
fotografias desbotando no meio da transição, o gesto que esta direção recusa.
Havia um script inline (~0,2kb, só na capa) que apagava o nome das três não
clicadas antes da navegação — mas ele só cobria a IDA (capa → portão): no
caminho de volta é a capa que ENTRA com quatro nomes contra o um do portão que
SAI, e um script disparado pelo clique dentro da capa nunca roda nessa direção.
A correção que fecha as duas — `::view-transition-old(*):only-child` em
`global.css` — não sabe (nem precisa saber) qual documento é a origem: um nome
sem par vira filho único do próprio `::view-transition-image-pair`, e a regra
desliga a animação dele. Zero JavaScript, cobertura maior.

**A "emenda" verde foi construída e depois removida.** A plataforma de destino
(OnerTravel) tem header verde e este site é navy; a primeira versão avisava
disso com uma faixa degradê de 3px sob o botão. Na tela ela não se lia — a
metade esquerda do degradê era a mesma cor do botão em cima dela. Quem faz esse
trabalho é a frase ("a busca abre em nova aba, na plataforma de reservas"), e o
token `--plataforma-500` saiu junto. Está registrado aqui para ninguém
reinventar a faixa achando que é melhoria.

**Nomes de terceiros em tipografia, nunca logotipo.** CVC, Booking, Decolar e
Hotéis.com são marcas registradas de terceiros e não há ativo licenciado neste
repositório. Mesma decisão que o Coopluz tomou com os logos de emissora e o
`seguros` com os das seguradoras.

**O site não afirma número de Cadastur.** Afirmar registro sem o número é
alegação que ninguém consegue checar. O que ele afirma é o registro SUSEP da
corretora do grupo, **com a URL da consulta pública junto** — alegação com
caminho de verificação é o que motor de resposta cita; número solto, não. O
`llms.txt` diz explicitamente que o número de Cadastur não está publicado, para
o modelo não deduzir um.

**`consts.ts` é duplicado, não importado.** Este repositório não tem dependência
de build no hub (decisão do hub: nenhum import atravessando a fronteira). Ao
mudar NAP, telefone, fundação ou horário no hub, replicar aqui à mão. O
telefone é o **mesmo** do hub — é o número impresso nas peças.

**Uma organização no JSON-LD, do tipo `TravelAgency`.** Não `Organization`
genérica: é o tipo que schema.org tem para agência de viagens, e é o que
permite distinguir esta empresa de uma companhia aérea. O `parentOrganization`
aponta para o hub, senão dois domínios com o mesmo endereço e telefone
aparecem como empresas diferentes — que é o que derruba SEO local.

**Sem blog.** Não há pesquisa de cluster escrita para turismo. Entra quando
houver; o esqueleto do Coopluz mostra o caminho.

## Custo

Faixa: **captação** (o site existe para produzir um clique na busca).

```
JS de página: 0 bytes, nas 9 rotas (nenhuma dependência de runtime). Havia um
              script inline de ~0,2kb só na capa, que apagava o
              view-transition-name das peças não clicadas antes da
              navegação — ele só cobria a IDA (capa -> portão). A mesma
              correção agora é CSS puro (`:only-child` em global.css) e
              cobre as duas direções; o script saiu (2026-08-29).
JS de terceiro: ~172 kb, GA4 (gtag.js), nas 9 rotas — carrega DEPOIS do
                `load`, fora do caminho do LCP. Medido por
                logos/verificar.mjs (ORCAMENTO.js = 180000); o filtro
                antigo (`url().endsWith(".js")`) lia 0, porque a URL do
                GA4 termina em query string, não em `.js`.
Fonte: 2 arquivos — Instrument Serif 400 (20,5 kb, precarregada, é o texto
       do LCP) e IBM Plex Mono 600 (15,6 kb, font-display: optional)
Fotografia: abertura 39,8 kb em 1280 / 67,3 kb em 1920 (AVIF); as 4 peças
            da vitrine somam 133 kb em 1040, todas lazy e abaixo da dobra
PRIMEIRA TELA em 1440px: 116 kb (html + css inline + serifa + abertura)

LCP: 296-500ms nas 9 rotas (orçamento interno 800ms · limiar CWV 2500ms)
CLS: 0,0000 (orçamento 0,01 · limiar CWV 0,1)
Elemento de LCP: IMG nas 5 rotas com fotografia; P nas 4 de documento

Fallback: sem JS a página é idêntica. Se a fotografia não chegar, o
          container fica pintado com a COR MÉDIA dela (gerada pelo
          pipeline, gravada no manifesto) e o véu, a tipografia, o
          peitoril e a grade continuam compostos — não é um retângulo
          cinza, é a mesma página com um bloco de cor no lugar da
          imagem. Com prefers-reduced-motion, tudo nasce inteiro e
          parado.
Fora do limiar bom de CWV? não
```

Medido em `logos/verificar.mjs`: build estático servido localmente, 1440x900,
mediana de 5 amostras. Ele falha com código 1 se qualquer número estourar o
orçamento — que está na constante `ORCAMENTO` no topo dele, não neste README.

**Ressalva honesta:** esses números são de máquina local sem throttle de rede.
Em 4G simulado o LCP sobe; o que protege a margem é o tamanho — 116 kb de
primeira tela com zero JS de página bloqueante tem folga larga para os 2,0s
da faixa.

Também verificado, nas 9 rotas: console limpo em 4 larguras, nenhum estouro
horizontal, todas as paradas de teclado com anel de foco visível (26 na capa),
nada preso fechado com `prefers-reduced-motion`, nada preso fechado depois de
rolar a página inteira, e nenhum `view-transition-name` órfão nas DUAS
direções da passagem capa <-> portão (congelada em 60ms e 140ms pela Web
Animations API; até 2026-08-29 o gate só testava a ida, e testava com o
listener no documento errado — a volta tinha três nomes órfãos de verdade e
o gate não acusava).

## Deploy

Projeto Vercel próprio (não o mesmo do hub), variável de ambiente
`SITE_URL=https://viagens.roilabs.com.br`, domínio apontado no projeto — passo
manual, fora do código.

`SITE_URL` inválida não derruba o build: o `astro.config.mjs` valida com
`URL.canParse`, avisa no log e cai no domínio de produção. O build para de
quebrar, mas o canonical fica errado — conferir a variável continua sendo
obrigação.

### O lado do hub

Migrar uma vertical tem duas metades, e publicar só uma recria a canibalização
que a spec 003 do Coopluz existiu para matar. No hub (`C:\dev\autogestor`):

- `externo` em `src/data/solucoes.ts` aponta a vertical para cá;
- `/viagens` deixa de ser publicado e responde **301**, declarado em
  `astro.config.mjs`;
- `src/pages/viagens.astro` foi removido.

Regra: **uma URL, um domínio.** `canonical` cruzada não serve — mantém as duas
páginas servindo 200 e depende de o buscador acatar uma dica.

O slug continua `viagens` nos dois lados (diferente do seguro, onde o subdomínio
é `seguros` e o slug é `seguro`), então não há armadilha de nomenclatura aqui.
