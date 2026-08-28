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
npm test          # node --test test/*.test.mjs — a conta da placa
npm run build
npm run check     # astro check (tipos) — 0 erros
npm run contraste # mede os 45 pares de cor DOS TOKENS; falha com código 1
npm run contraste-gravura # mede os pares que só existem em PIXEL (ver abaixo)
npm run verificar # prova no navegador: 3 larguras × 4 rolagens, teclado, LCP
npm run mapas     # regera os contornos a partir do dado geográfico (ver abaixo)
npm run fotos     # rebaixa as 4 fotografias de parede do Unsplash (ver abaixo)
node logos/gerar-og.mjs   # regera a imagem de compartilhamento
```

`npm run mapas` só é necessário quando a **lista de destinos** de
`src/data/conteudo.ts` muda. Ele baixa Natural Earth 1:50m e a malha do IBGE
para `logos/_dados/` (ignorado pelo git), e escreve três saídas que **são**
commitadas — `src/styles/mapas.css`, `src/data/mapas.ts` e os cinco
`public/img/parede*.svg`. O build nunca precisa de rede.

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

**A direção é "Solari" (geometria · autônomo · escura, 0kb de JS).** A página é
uma placa de embarque e o verbo é **virar**: uma pá gira no eixo horizontal e
trava num valor novo. Esse gesto único aparece nas quatro camadas —

| camada | onde |
|---|---|
| entrada | as quatro linhas da placa viram e travam, com 60ms entre elas |
| scroll | cada item da lista densa vira ao entrar, via `animation-timeline: view()` |
| ponteiro | a célula de status vira de `24H` para `ABRIR` no hover (desligada em `hover: none`) |
| transição | View Transitions entre rotas: a faixa atravessa, o corpo vira |

Não há fade em lugar nenhum do site: pá não desbota, pá vira.

**Por que não virou "tema hacker".** A monoespaçada é o material da direção
porque placa de embarque *é* uma grade de células de largura fixa. Mas ela
manda só no display, nos códigos e nas linhas da placa — o texto corrido roda
na pilha do sistema (0kb baixados). Mono em 400 palavras cansa, e o público
desta página não é técnico. A spec original de `Terminal Vivo` avisa disso, e é
exatamente essa a parte que foi recusada.

**O H1 não anima, e isso é regra, não esquecimento.** Ele é o elemento de LCP
(confirmado: `H1.placa__titulo`, medido em `logos/verificar.mjs`). Elemento de
LCP não entra na coreografia — o resto chega em volta dele.

**A pá que gira sozinha mostra DESTINO, nunca preço.** Nome de cidade é fato;
tarifa sem consulta seria número inventado. Preço de passagem muda por rota,
por data e por hora, e o valor válido é o da busca no momento da compra. Isso
está declarado na primeira tela, em `/sobre`, nos Termos, no rodapé e — em
maiúsculas — no `llms.txt`, para um motor de resposta não preencher a lacuna
sozinho. Há um teste que falha se um `R$` aparecer no conteúdo servido.

**A saída da pá vaza para além do próprio slot, de propósito.** Com a saída
dentro do slot (`11.5%→12.5%`) a pá que sai terminava exatamente quando a
seguinte começava, e sobravam 176ms com a janela **vazia** — o gesto principal
da página piscando em branco a cada 2,2s. Medido quadro a quadro, não deduzido.
Agora a saída ocupa `12.5%→13.5%`, sobrepondo a entrada da próxima. Placa de
verdade nunca fica vazia: a pá que chega tapa a que sai. `test/placa.test.mjs`
falha se alguém "consertar" isso.

**A macroestrutura é o Índice, não a pilha de seções.** O hub e o Coopluz
compartilham `.secao > .container > olho + h2 + chamada`; o site de seguro é um
percurso de estações em grade 5/7. Aqui tudo é lista: **zero cards na página
inteira**. Os quatro produtos que no hub eram cards com ícone são linhas de
placa, com código à esquerda e status à direita, e a linha inteira é o link —
não há botão dentro dela. A nav é a faixa de status (não uma barra de 4 links) e
o rodapé é uma linha só (não um bloco de 4 colunas), porque o site tem quatro
páginas e quatro páginas cabem numa linha.

**As páginas internas não encenam a placa.** `/sobre`, `/privacidade` e
`/termos` usam `.doc`, um documento simples. São fichas, não painéis de
partida; encenar um percurso que o conteúdo não tem é pior que não encenar
nenhum.

**Contraste é medido, não estimado, e o checador lê o CSS.** `npm run contraste`
roda 37 pares e falha com código 1. Diferente do mesmo script no site de
seguro, ele **não tem uma cópia da paleta em hex**: lê `tokens.css`, resolve os
aliases `var()` e converte OKLCH → sRGB na hora. Uma fonte da verdade só.

Ele pegou um defeito antes de a página existir: a borda do botão de contorno
dava **2.32:1** sobre a placa, abaixo do 3:1 que a WCAG 1.4.11 exige para
limite de componente interativo. Daí `--noite-600` estar em `L 0.505` e não em
`0.44` — é contraste, não gosto. O anel de foco tem o mesmo tipo de armadilha
e a mesma solução do hub: sobre o botão laranja um anel laranja daria 1.0:1 e
sumiria, então `--foco` é custom property e o `.btn--primario` a troca pela
tinta escura do próprio rótulo (7.19:1).

**As figuras do site são dado, não desenho.** Cada pá tem o contorno REAL do
lugar gravado na face, e a parede atrás dos painéis é um mapa dos lugares que
esta busca cobre — 19 formas, nenhuma a mais. Nada disso é traçado à mão:
`logos/gerar-mapas.mjs` sai de fonte primária (Natural Earth 1:50m para país,
malha oficial do IBGE para as cinco macrorregiões) e a PATAGÔNIA é Argentina +
Chile recortados no paralelo 39°S, um recorte geométrico declarado no código.
É a mesma regra que proíbe preço inventado na placa, aplicada à imagem: um
contorno "parecido com a Argentina" seria a versão gráfica do mesmo defeito.

**Uma figura por parede, e a divisão foi medida.** A parede da CAPA é o mapa
dos 19 destinos; a dos QUATRO PORTÕES é uma fotografia (`npm run fotos` baixa
do Unsplash, dessatura, equaliza e converte para AVIF/WebP — a procedência de
cada uma fica na tabela do próprio script, e o crédito em
`public/img/FOTOS.json`). As duas camadas não coexistem, e o motivo é
aritmético, não estético: o mapa a `--parede-luz: 0.115` já media 4.73:1 no par
`--texto-3` × pixel mais claro da parede, contra um piso de 4.5. Somar a foto
por baixo derrubava para **3.73:1**; dividir o orçamento entre as duas
(0.07 + 0.07) passava em 4.51:1 entregando duas figuras apagadas. Então
`Base.astro` apaga uma quando acende a outra — com `--parede: none`, não com
opacidade zero, senão o SVG ainda seria baixado. A gravura das PÁS não entra
nessa conta e continua em todas as rotas: ela mora dentro da peça.

A fotografia é MATÉRIA, não assunto: entra a 16% de opacidade, em escala de
cinza, retingida pelas duas tintas da casa (`color` com o navy troca o matiz
preservando a luminância; `soft-light` com o laranja levanta o quente só onde
a foto já era clara). Ela não é o LCP (240ms, num `<p>`), não tem `alt`, não
entra na ordem de leitura e nenhuma delas mostra rosto identificável ou marca
de companhia aérea — pessoa aqui é silhueta anônima de saguão, porque modelo
de banco posando de cliente satisfeito seria a versão fotográfica do preço
inventado que esta placa recusa.

**Existem dois checadores de contraste, e o segundo não é redundância.**
`logos/contraste.mjs` lê os TOKENS e resolve OKLCH → sRGB; ele não consegue ver
a gravura, porque o pixel embaixo da letra ali é o resultado de um
`background-blend-mode: soft-light` e só existe depois de pintado.
`logos/contraste-gravura.mjs` pinta e mede o pixel. Ele reprovou duas vezes
antes de a direção fechar:

- a primeira versão da parede era um fio branco a 13% e `--texto-3` sobre ela
  dava **3.87:1**, abaixo do piso de 4.5. Daí a parede ser um sulco de DOIS
  fios (escuro + claro): a mesma leitura por metade do claro, hoje em 4.73:1;
- o próprio medidor mentiu antes disso, acusando 3.35:1 em todas as pás — o
  pixel culpado era o antialiasing da letra laranja, não a superfície. Filtrar
  por faixa de cor não resolve (a suavização é um degradê contínuo); apagar a
  tinta e medir a peça, sim;
- e ele reprovou a fotografia de parede duas vezes antes de ela virar o que é
  hoje: **3.41:1** com o pico solto e **3.68:1** com o pico cortado em 168.
  Foi o que forçou a regra de uma figura por parede. O checador também mudou
  junto: ele media a parede só na capa (bastava, quando os cinco SVG saíam do
  mesmo gerador com o mesmo teto de alfa) e não servia AVIF, o que faria a
  medição passar por um motivo falso — imagem recusada não pinta. Agora varre
  as cinco rotas e nomeia a pior.

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
JS adicionado: 0 kb gzip (nenhuma dependência de runtime)
LCP: 0,32s (alvo 1,5s) · CLS: 0,0000 (alvo 0,05) · INP: n/d (não há interação com JS)
Elemento de LCP: H1.placa__titulo
Fonte: 1 arquivo, 15,6 kb (IBM Plex Mono 600, subset latin, do próprio domínio)
Matéria: 0 kb baixados — grão é um feTurbulence gerado UMA vez em data-uri
         (~330 bytes no CSS, estático, nunca dentro de @keyframes) e todo o
         volume é gradiente e box-shadow. Uma camada de mix-blend-mode no
         site inteiro, fixa, que não repinta no scroll.
Fallback: sem JS a página é idêntica — a coreografia inteira é CSS. Sem suporte
          a scroll-timeline ou com prefers-reduced-motion, a placa nasce
          inteira e parada, com um destino visível e o vinco no lugar.
Fora do limiar bom de CWV? não
```

Medido em `logos/verificar.mjs`: build estático servido localmente, CPU 4×
estrangulada, 1440×900, mediana de 5 amostras. O `verificar.mjs` falha com
código 1 se qualquer um desses números estourar o orçamento — o orçamento está
escrito na constante `ORCAMENTO` no topo dele, não neste README.

Também verificado: console limpo nas três larguras, nenhum estouro horizontal,
22 paradas de teclado todas com anel de foco visível, 45 pares de contraste
medidos por `logos/contraste.mjs` a partir dos próprios tokens e mais 10 pares
medidos em pixel por `logos/contraste-gravura.mjs` (0 reprovados nos dois).

Três quadros extras congelam a pá NO MEIO DA QUEDA pela Web Animations API e
medem a camada de luz: 0,77 → 0,49 → 0,00. É o que prova que a peça aterrissa
e SÓ ENTÃO termina de pegar a luz, em vez de chegar acesa — a diferença entre
uma superfície e um texto girando, e ela não aparece em quadro parado.

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
