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
npm run contraste # mede os 23 pares de cor; falha com código 1 se algum reprovar
npm run verificar # prova no navegador: 3 larguras × 4 rolagens, teclado, LCP
node logos/gerar-og.mjs   # regera a imagem de compartilhamento
```

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
roda 23 pares e falha com código 1. Diferente do mesmo script no site de
seguro, ele **não tem uma cópia da paleta em hex**: lê `tokens.css`, resolve os
aliases `var()` e converte OKLCH → sRGB na hora. Uma fonte da verdade só.

Ele pegou um defeito antes de a página existir: a borda do botão de contorno
dava **2.32:1** sobre a placa, abaixo do 3:1 que a WCAG 1.4.11 exige para
limite de componente interativo. Daí `--noite-600` estar em `L 0.505` e não em
`0.44` — é contraste, não gosto. O anel de foco tem o mesmo tipo de armadilha
e a mesma solução do hub: sobre o botão laranja um anel laranja daria 1.0:1 e
sumiria, então `--foco` é custom property e o `.btn--primario` a troca pela
tinta escura do próprio rótulo (7.19:1).

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
22 paradas de teclado todas com anel de foco visível.

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
