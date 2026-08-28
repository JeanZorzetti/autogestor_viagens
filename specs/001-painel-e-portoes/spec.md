# Feature Specification: O saguão — painel de partidas em escala de herói e quatro portões de embarque

**Feature Branch**: `001-painel-e-portoes`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Eu quero mais /art-direction, grande o suficiente para ser uma spec via spec-kit." Diante de três movimentos propostos (A — portões de embarque; B — escala de herói; C — a direção admite fotografia), o dono escolheu **A + B numa spec só**.

## Contexto

O site nasceu e foi materializado no mesmo dia (duas entradas em `.art/log.json`, ambas de 2026-08-27). A direção `solari` está fechada e provada: o verbo é **virar**, existe uma fonte de luz única a 200°, todo filete é fresta, a pá tem duas metades com vinco, o custo é 0kb de JS e o LCP mediano é 316ms contra um alvo de 1500ms.

O que existe hoje, em números:

| | Hoje |
|---|---|
| Rotas servidas | 5 — `/`, `/sobre`, `/privacidade`, `/termos`, `/404` |
| Rotas que vendem alguma coisa | 1 |
| Pás que viram na capa | 1 (o bloco `.destino`, um widget ao lado da lista) |
| Linhas da placa | 4, e cada uma é um link **para fora** |
| Destino de todo CTA | `https://br.onertravel.com/autogestorviagens/home` |
| JS enviado ao cliente | 0 bytes |

Dois problemas, um de direção e um de negócio, e eles são o mesmo problema visto de dois lados.

**De direção:** o gesto principal é uma célula. A pá do destino mede `--t-pa` (3.25rem no teto) e vive num quadradinho ao lado do H1 — é o segundo maior elemento da página, mas ainda é um *widget*. A placa que dá nome à direção não é o plano da página; é uma lista com um enfeite giratório em cima. A materialização de hoje deu **corpo** à peça sem lhe dar **escala**.

**De negócio:** as quatro linhas da placa são as quatro coisas que a vertical vende, e todas as quatro levam para fora do domínio no primeiro clique. Não existe uma única página sobre passagem aérea, sobre hotel, sobre pacote ou sobre aluguel de carro. Um site de turismo com cinco URLs, das quais quatro são fichas legais e uma é a capa, não tem superfície nem para ser encontrado nem para ser citado. Esta é a vertical *self-service* — não capta lead, não tem banco, não tem `/api/lead` — e por isso a única coisa que ela pode fazer bem é **ser a página que a pessoa lê antes de clicar em buscar**. Hoje ela não tem essa página. Tem quatro links.

As duas coisas se resolvem com um movimento só, e é por isso que A e B são uma spec e não duas.

## A ideia que une A e B

> Hoje o site é **uma placa com uma pá**. Esta spec o transforma num **saguão**: a capa vira o painel de partidas em escala arquitetônica, e cada linha do painel passa a ter uma página atrás dela — um portão.

O verbo continua sendo **virar**, em três escalas em vez de uma:

| Escala | Onde | O que vira |
|---|---|---|
| **Célula** | a coluna de destino de uma linha | o nome de uma cidade |
| **Painel** | a capa inteira | as quatro linhas em cascata, o painel é o plano |
| **Portão** | a troca de rota | a célula clicada vira o objeto da página de destino |

Não há um quinto gesto e não há fade em lugar nenhum — o gate **G11 (uma ideia)** continua fechado por mérito, não por isenção. A transição capa→portão só existe porque as duas metades desta spec existem: é a camada de coreografia que **A sozinha ou B sozinha não conseguem entregar**, e é o argumento técnico para as duas andarem juntas.

### O que "escala de herói" NÃO pode significar

O clichê que espreita a opção B é o painel de aeroporto em tela cheia — a mesma imagem que toda agência de viagem já usou. A defesa entra como requisito, não como esperança:

1. **O painel tem exatamente quatro linhas, porque existem quatro produtos.** Encher o plano com linhas decorativas para "parecer um aeroporto" é dado inventado e reprova no gate **G9**. A escala vem do plano, da moldura e da luz — nunca de linha falsa.
2. **Não é um painel de voos, é um painel de comparação.** Não existe coluna de hora, não existe número de voo, não existe "PORTÃO 12", não existe "EMBARQUE ENCERRADO". A única coluna de estado diz `24h` — que é um fato sobre a busca, não um estado fictício de um voo.
3. **A parede continua visível.** O painel é uma peça parafusada numa parede, com moldura em toda a volta. Ele nunca sangra até virar papel de parede — se o painel encostar nas quatro bordas do viewport, ele deixa de ser objeto e vira filtro de tela.

## Clarifications

### Session 2026-08-27

Decisões tomadas na sessão de direção de arte, registradas para revisão:

- Q: "Mais art-direction" significa acabamento na capa atual, escala, ou troca de direção? → A: **Escala + interior (A + B)**. Acabamento já foi a entrega da manhã (`.art/log.json`, entrada 1). Troca de direção foi recusada: a `solari` tem um dia de vida e está fechada.
- Q: A escala de herói muda o dono do LCP? → A: **Não.** O H1 passa a ser o *cabeçalho do painel* — a faixa superior onde numa placa real está escrito PARTIDAS. Ele não vira, não anima e continua sendo o elemento de LCP (`H1.placa__titulo`, mediana 316ms). Isto elimina o maior risco da opção B sem custar nada da ambição: o que cresce é o plano, não o texto.
- Q: A pá continua sendo um widget ao lado da lista? → A: **Não.** O bloco `.destino` é absorvido: a pá deixa de ser um objeto isolado e vira **a coluna de destino de cada linha**. São 4 pás virando em vez de 1, na mesma célula de altura fixa que já existe.
- Q: Quatro portões com a mesma estrutura viram template. Como se evita? → A: Por **regra escrita de variação** (FR-020), não por bom senso na hora de implementar: cada portão amplia um objeto diferente e nenhum tipo de bloco se repete como "detalhe ampliado" entre os quatro.
- Q: Os portões colidem com URL viva no hub? → A: **Não.** O hub 301a `/viagens` para a raiz deste site e não publica nenhuma sub-rota de viagens (`autogestor/astro.config.mjs:66`, verificado). Diferente da spec 003 do `coopluz`, aqui não há canibalização a desfazer — há canibalização a **não criar**, e isso vira FR-041.
- Q: A vertical passa a captar lead? → A: **Não.** Continua sem banco, sem `/api/lead`, sem `pg`, `output: "static"`. Esta spec não abre essa porta.

### Pendências que bloqueiam parte da implementação

- **[NEEDS CLARIFICATION: link profundo por produto na OnerTravel]** — a busca é uma URL única (`br.onertravel.com/autogestorviagens/home`). Se a plataforma aceitar parâmetro de produto (aéreo / hotel / pacote / carro), cada portão deve abrir a busca **já filtrada**, e essa é metade da razão de o portão existir. Se não aceitar, os quatro CTAs terminam no mesmo lugar e o texto do botão precisa parar de prometer filtro. Resolver **testando a plataforma**, antes do `/plan` — não por suposição.
- **[NEEDS CLARIFICATION: quem assina as quatro listas de destino]** — o painel precisa de quatro listas de destino de comprimentos coprimos (FR-005). Nome de cidade é fato, mas "a busca vende Orlando" é uma afirmação sobre o inventário da OnerTravel. Ou o dono assina as quatro listas, ou elas caem para **país/região**, que são inquestionáveis. Não implementar até decidir: destino que a busca não vende é o gate G9 disfarçado de conteúdo.

## User Scenarios & Testing

### Primary User Story

Uma pessoa em Goiânia pesquisa "passagem aérea parcelada" no celular às 22h. Cai na página de passagens aéreas do site. Em cinco segundos ela vê um painel escuro com o código `AER` em escala de objeto e uma pá virando entre destinos reais — e entende, sem ler uma linha, que ali se compara passagem. Ela rola: encontra o que a busca cobre, as companhias que entram na comparação lado a lado, e uma ficha densa dizendo quem emite o bilhete, em quantas vezes dá para pagar e em quanto tempo o bilhete chega. Ela toca em buscar, a aba nova abre na plataforma de reservas, e ela sabe exatamente por que a marca do outro lado é diferente. Se em vez disso ela tivesse caído na capa, teria visto o painel inteiro — quatro produtos, quatro destinos virando — e escolhido a linha dela; a célula que ela tocou vira o objeto da página seguinte, e a navegação inteira lê como uma peça só mudando de valor.

### Acceptance Scenarios

1. **Given** um visitante na capa em 1440px, **When** a página pinta, **Then** o painel aparece completo e parado no primeiro quadro — moldura, quatro linhas, um destino legível por linha — e só depois de 160ms as pás começam a virar em cascata de cima para baixo.
2. **Given** a capa aberta e ociosa por dois minutos, **When** o visitante observa o painel, **Then** as quatro colunas de destino nunca mostram a mesma combinação duas vezes nesse intervalo.
3. **Given** um visitante na capa, **When** ele ativa a linha `AER` (clique, toque ou Enter com foco), **Then** ele chega em `/passagens-aereas` e a célula que ele ativou aparece como o objeto ampliado do portão, sem a página piscar em branco.
4. **Given** um navegador sem suporte a View Transitions, **When** o visitante ativa a mesma linha, **Then** a navegação acontece normalmente, sem transição e sem erro no console.
5. **Given** um visitante com `prefers-reduced-motion: reduce`, **When** ele abre qualquer uma das cinco rotas, **Then** o painel nasce inteiro e imóvel, com um destino visível por linha, o vinco no lugar, e nenhuma informação exclusiva do movimento.
6. **Given** um visitante em 360px de largura, **When** ele abre qualquer portão, **Then** não há estouro horizontal, nenhum rótulo da placa quebra em duas linhas, e a célula mantém altura fixa (`--celula-mobile`).
7. **Given** um visitante navegando só por teclado, **When** ele percorre qualquer uma das cinco rotas de ponta a ponta, **Then** toda parada tem anel de foco visível e o anel tem contraste ≥ 3:1 contra a superfície onde aparece.
8. **Given** um leitor de tela na capa, **When** ele percorre o painel, **Then** cada linha é anunciada como um link com produto, abrangência e o aviso de nova aba, e a coluna de destino que vira não é lida como texto mudando no meio da leitura.
9. **Given** qualquer conteúdo servido no `dist`, **When** o teste do repositório roda, **Then** ele falha se encontrar preço, hora de voo ou número de voo em qualquer rota.
10. **Given** um portão, **When** um mecanismo de busca ou motor de resposta lê a página, **Then** existe um `@id` de produto/serviço no JSON-LD, um H1 único e uma resposta direta no primeiro parágrafo (BLUF).

### Edge Cases

- **Fonte não chega.** `font-display: optional` já garante que a Plex Mono não substitui depois de pintar. Com quatro pás virando, um refluxo tardio seria quatro vezes mais visível — a métrica do fallback (`@font-face "Placa fallback"`) precisa cobrir também a largura das novas colunas.
- **Nome de destino comprido.** "BUENOS AIRES" tem 12 caracteres; a janela hoje é de 18ch. Em quatro colunas simultâneas o orçamento horizontal aperta: nenhuma lista pode conter nome que estoure a janela na largura de 46rem. Isso é regra de conteúdo (FR-007), não de CSS.
- **Rótulo de produto em 360px.** "Passagens aéreas" a 18px de mono mede 173px e já quebrou uma vez; a 16px mede 154px e quebrou de novo quando o padding subiu de `--e-2` para `--e-3`. A mono não perdoa 1px — está no log duas vezes. Qualquer mudança de padding na linha exige remedir as quatro colunas nas três larguras.
- **JS desligado.** A coreografia inteira é CSS. A página é idêntica sem JS — e isso precisa continuar verdadeiro depois de quatro rotas novas.
- **Portão aberto direto, sem passar pela capa.** É o caso mais comum de tráfego orgânico. O portão precisa se explicar sozinho: quem opera o site, o que é a plataforma do outro lado, e um caminho de volta ao painel que **não é breadcrumb** — é uma linha de placa.
- **Navegador sem `animation-timeline`.** O `@supports` já isola; o conteúdo nasce visível em vez de nascer escondido esperando um scroll que nunca dispara.

## Requirements

### Lei da matéria (herdada, não renegociável)

- **FR-001** — Toda superfície nova obedece à fonte de luz única a 200° já declarada em `tokens.css`: aresta virada para cima acende, sombra cai para baixo e para a direita. Nenhum elemento novo pode ter sombra em direção própria.
- **FR-002** — Toda sombra sai de `--sombra-cor` (navy fechado). Preto puro sobre objeto azul continua proibido (gate G18).
- **FR-003** — Todo filete é fresta (fio escuro + fio claro), em toda superfície nova de painel. As páginas `.doc` (`/sobre`, legais) continuam em filete simples: são fichas, não painéis, e essa distinção é deliberada.
- **FR-004** — O grão continua sendo **uma** camada `position: fixed` para o site inteiro. Nenhuma superfície nova ganha `::after` próprio — cada `mix-blend-mode` cria uma camada de composição, e grão por linha repinta no scroll.

### O painel (capa)

- **FR-005** — O bloco `.destino` deixa de existir como widget isolado. Cada uma das quatro linhas do painel ganha uma **coluna de destino** que vira sozinha, com sua própria lista. Os comprimentos das quatro listas são **coprimos entre si** (proposta: 5 / 7 / 8 / 11), de modo que a combinação visível na tela só se repita depois de ≥ 1 hora de página aberta. Custo: 0kb de JS — a não repetição vem da aritmética das listas, não de um sorteio.
- **FR-006** — As quatro linhas viram em **cascata de cima para baixo**, com atraso fixo entre irmãs (proposta: 120ms, contra um giro de 176ms, para a cascata ser lida como cascata e não como quatro coisas separadas).
- **FR-007** — Nenhum nome de destino, em nenhuma das quatro listas, pode passar de **12 caracteres** — o teto medido: `"BUENOS AIRES"` (12) ocupa 79% da janela de 18ch na largura de 46rem, e `CENTRO-OESTE` (12) é o pior caso das listas propostas. Verificado por teste, não por leitura. *(Corrigido em 2026-08-28: a redação original dizia "não pode estourar a janela" sem número — a Phase 0 mediu e o número é 12.)*
- **FR-008** — O painel tem **exatamente quatro linhas**, uma por produto. Linha decorativa, linha de "próximas ofertas", linha com hora ou número de voo: proibidas (gate G9).
- **FR-009** — O painel é um objeto parafusado numa parede: moldura visível em toda a volta e `--fundo` respirando fora dela em todas as três larguras. O painel não encosta nas quatro bordas do viewport.
- **FR-010** — O H1 é o **cabeçalho do painel**, permanece dono do LCP, e não anima opacidade, escala nem posição. Ele já está no primeiro quadro; o resto chega em volta dele.
- **FR-011** — O painel ocupa a primeira tela sem depender de `100vh`: unidade dinâmica com fallback, e a quarta linha precisa estar visível ou meio-visível em 360×640 — nunca completamente abaixo da dobra, senão o gesto multiplicado não é percebido.
- **FR-012** — A altura de cada célula continua fixa (`--celula` / `--celula-mobile`) e reservada **antes** de qualquer animação. Nenhuma linha cresce com o conteúdo.
- **FR-013** — Abaixo de 46rem, cada linha passa a duas fileiras (código + nome / destino + estado) mantendo célula de altura fixa, fresta e moldura. Ela continua lendo como painel; não vira lista.
- **FR-014** — A coluna de estado continua dizendo `24h` e trocando para `Abrir` no ponteiro. Nada exclusivo do ponteiro (gate G27); desligada em `(hover: none)`.

### Os portões

- **FR-015** — Nascem quatro rotas estáticas: `/passagens-aereas`, `/hoteis`, `/pacotes`, `/aluguel-de-carro`. Slugs em português e por termo de busca, não por código interno — `AER` é a linguagem do painel, não a da consulta que traz a pessoa.
- **FR-016** — Todo portão usa a macroestrutura **Portão**, declarada como variante de *Espécime* (`estruturas.md` §4) executada em matéria de placa. Ritmo de cinco blocos:
  1. **Cabeça de portão** — o código do produto em escala de objeto, como uma pá que acabou de travar, com a coluna de destino daquele produto ainda virando.
  2. **O que está atrás** — lista densa do que a busca cobre. Zero card, zero ícone de linha.
  3. **Detalhe ampliado** — um aspecto só, ampliado. Único por portão (FR-020).
  4. **Ficha** — tabela de fatos: abrangência, formas de pagamento, prazo de emissão, quem emite, quem opera o site.
  5. **Ação** — a tecla, com a advertência de aba nova e de mudança de ambiente visual.
- **FR-017** — A macroestrutura Portão é diferente do **Índice** da capa e do **`.doc`** das fichas legais, e diferente da estrutura dos três irmãos (pilha `.secao > .container` no hub e no `coopluz`, Percurso em grade 5/7 no `seguros`). Gate G33.
- **FR-018** — A faixa de estado (nav) e o rodapé de uma linha são mantidos nos portões: são metade da silhueta do site e trocá-los por rota faria cinco páginas parecerem cinco sites.
- **FR-019** — O caminho de volta ao painel é **uma linha de placa**, não um breadcrumb e não um botão "voltar". Quem chega direto de busca precisa descobrir o painel; quem veio do painel precisa reconhecê-lo.
- **FR-020** — **Regra de variação.** Cada portão amplia um objeto diferente, e nenhum tipo de bloco se repete como bloco 3 entre os quatro. Quatro portões com o mesmo desenho e o texto trocado reprovam esta spec inteira, por melhor que estejam individualmente:

  | Portão | Rota | Objeto da cabeça | Bloco 3 — detalhe ampliado (único) |
  |---|---|---|---|
  | AER | `/passagens-aereas` | par de pás, ida ‖ volta | as companhias que entram na comparação, lado a lado |
  | HTL | `/hoteis` | pá única sobre uma faixa de noites | os regimes de hospedagem como quatro estados de uma mesma pá |
  | PCT | `/pacotes` | pá de duas metades — voo em cima, hotel embaixo, o vinco é a emenda | o que entra e o que não entra no mesmo preço, em duas colunas de fresta |
  | CAR | `/aluguel-de-carro` | pá com retirada e devolução no mesmo campo | os aeroportos de retirada, em grade de códigos IATA |

- **FR-021** — Nome de terceiro aparece **em tipografia, nunca como logotipo**. Companhia aérea, rede hoteleira, locadora e concorrente são marcas registradas e não há ativo licenciado neste repositório — mesma decisão que o `coopluz` tomou com as emissoras e o `seguros` com as seguradoras.
- **FR-022** — O bloco 3 do portão PCT é a peça em que a direção se prova: um pacote **é** voo mais hotel unidos por uma emenda, e a pá **é** duas metades unidas por um vinco. A matéria carrega o argumento; o texto não repete o que a peça já diz.
- **FR-023** — Cada portão declara a mesma verdade sobre ambiente: a busca abre em nova aba, na plataforma de reservas, com marca visualmente diferente. A "emenda visual" em degradê já foi construída e removida uma vez por não se ler na tela — **não reinventar**; quem faz esse trabalho é a frase.
- **FR-024** — Cada portão tem H1 único, `<title>` e meta description próprios, e uma resposta direta no primeiro parágrafo (BLUF). Nenhum portão herda o `<title>` da capa.

### A transição

- **FR-025** — A célula ativada no painel vira o objeto da cabeça do portão, via View Transitions cross-document, com nome de transição por código de produto. É a quarta camada da coreografia e a única entrega que exige A e B juntos. *(Aditado em 2026-08-28, G4:* os **três nomes sem par** no documento de destino não podem receber o fade padrão do navegador — eles saem com o mesmo gesto do `corpo`. Sem essa regra eles ficam parados, retos e nítidos sobre a página nova depois que o corpo já saiu; medido, e é fade puro, que a constituição proíbe. Decisão e medida em `contracts/coreografia.md` §3.*)*
- **FR-026** — A faixa de estado continua atravessando (`view-transition-name` já existente) — o novo nome por produto se soma, não substitui.
- **FR-027** — Sem suporte a View Transitions, a navegação acontece sem transição, sem erro e sem perda de conteúdo. Nunca sem conteúdo.
- **FR-028** — Em `prefers-reduced-motion: reduce`, toda transição de rota é desligada — **por regra explícita**, não por omissão. *(Aditado em 2026-08-28, G4:* as regras de `::view-transition-*(corpo)` moram dentro de `@media (prefers-reduced-motion: no-preference)`, então sob `reduce` elas não se aplicam e sobra o cross-fade padrão do navegador. Hoje o caminho de acessibilidade é a versão mais cheia de fade da página. Medido.*)*

### Conteúdo e verdade

- **FR-029** — Nenhum preço, nenhuma tarifa, nenhum "a partir de", em nenhuma das cinco rotas. A tarifa vive na busca e muda por rota e por data.
- **FR-030** — O teste que hoje falha ao encontrar `R$` no conteúdo servido é estendido para falhar também com hora de voo (`HH:MM` em contexto de painel) e número de voo.
- **FR-031** — Toda alegação verificável nos portões carrega o caminho de verificação junto (o padrão que o FAQ já usa com a consulta SUSEP e o Cadastur). Afirmar registro sem o caminho de conferência é alegação nua.
- **FR-032** — Todo conteúdo novo mora em `src/data/conteudo.ts` e `src/consts.ts`. Nenhuma string de fato nasce dentro de um `.astro`. As quatro listas de destino do painel são **a mesma fonte** que alimenta a cabeça de cada portão — uma fonte da verdade, dois usos.
- **FR-033** — O FAQ da página e o `FAQPage` do JSON-LD continuam saindo da mesma lista. Se um portão ganhar FAQ próprio, a mesma regra vale ali.

### Piso inviolável

- **FR-034** — Todo par de cor novo passa por `npm run contraste`, que falha com código 1. Texto de leitura ≥ 4.5:1; limite de componente interativo ≥ 3:1.
- **FR-035** — O anel de foco troca de cor conforme a superfície (laranja sobre navy, tinta escura sobre laranja). Toda superfície nova precisa declarar qual anel usa.
- **FR-036** — Todo movimento tem bloco `prefers-reduced-motion: reduce` com estado final estático e legível, **no mesmo commit**.
- **FR-037** — A coluna de destino que vira é `aria-hidden`, com o conteúdo equivalente disponível em texto para leitor de tela — o padrão que a capa já usa.
- **FR-038** — Nenhum `filter` ou `backdrop-filter` dentro de keyframe (gate G21).

### Orçamento

- **FR-039** — Faixa **captação**, mantida. JS enviado ao cliente: **0 bytes** em todas as cinco rotas. Se algum requisito desta spec exigir JS, ele é cortado — não é o orçamento que cede.
- **FR-040** — Nenhuma dependência nova. Nenhuma imagem nova. Nenhum peso de fonte novo — a Plex Mono 600 subset (15.6kb) já cobre tudo.
- **FR-041** — As quatro rotas novas entram no `sitemap`, no `llms.txt` e no `robots.txt` conforme o padrão do repositório, e nenhuma delas pode colidir com URL viva no hub. Verificação explícita antes do merge: o hub hoje só publica o 301 de `/viagens`.

### Key Entities

- **Produto** (4, já existente em `PRODUTOS`): código de três letras, nome, abrangência, nota, ícone. Ganha: rota própria, lista de destinos própria, objeto de cabeça, tipo do bloco 3.
- **Lista de destino** (4, nova): nomes de lugar, comprimentos coprimos entre si, ligada a um produto. Fato verificável, nunca preço.
- **Portão** (4, novo): produto + macroestrutura de cinco blocos + ficha + JSON-LD próprio.
- **Painel** (1, transformado): quatro linhas, quatro colunas de destino, moldura, cabeçalho que é o H1.

## Success Criteria

Todo critério abaixo é medido pelas ferramentas que já existem no repositório (`npm test`, `npm run contraste`, `npm run verificar`, `npm run check`) contra o **build servido estático**, nunca contra o `astro dev` — a barra de ferramentas do Astro injeta ~1,8 MB de JS que não existe em produção.

- **SC-001** — `npm run contraste` termina com 0 reprovados, e o número de pares medidos sobe de 37 para ≥ 45 (as superfícies novas do painel e dos portões entram na medição, não ficam de fora dela).
- **SC-002** — `npm run verificar` cobre **9 rotas × 3 larguras × 4 posições de scroll**, com console limpo e zero estouro horizontal em todas as combinações. *(Corrigido em 2026-08-28: a redação original dizia 5 rotas. São 8 públicas + `/404` = 9. E a linha de base não é 5 nem 9: hoje `logos/verificar.mjs` visita **uma** rota — a capa. Cobrir 9 é reestruturar o laço, não parametrizá-lo.)*
- **SC-003** — LCP mediano ≤ 800ms por rota (5 amostras, CPU 4× estrangulada), contra o alvo declarado de 1500ms da faixa captação. O elemento de LCP da capa continua sendo o H1.
- **SC-004** — CLS ≤ 0.01 em todas as cinco rotas. Hoje é 0.00 e as alturas de célula são fixas — o alvo tem folga, não licença.
- **SC-005** — JS enviado ao cliente = **0 bytes** em todas as cinco rotas, verificado no `.vercel/output/static`.
- **SC-006** — `npm test` falha se qualquer conteúdo servido contiver preço, hora de voo ou número de voo.
- **SC-007** — Passagem de teclado completa nas cinco rotas: 0 paradas sem anel de foco visível.
- **SC-008** — Um quadro com `prefers-reduced-motion: reduce` por rota, provando o painel completo e parado com um destino visível por linha.
- **SC-009** — Um quadro da transição capa→portão provando a célula virando no objeto do portão, e um caminho de degradação limpa provado em navegador sem View Transitions. *(Método fixado em 2026-08-28, G3:* o quadro é congelado pela Web Animations API a partir de `pagereveal` no documento novo; o navegador da prova é o **Firefox** (144 medido: sem `pagereveal`, sem `pageswap`, console limpo, conteúdo inteiro), e **não** o WebKit, que faz VT cross-document. O teste de suporte é `"onpagereveal" in window` — `CSS.supports("view-transition-name", …)` dá falso positivo no Firefox. Ver T051.*)*
- **SC-010** — Um quadro de hover no painel e um quadro em 360px por portão, provando que nenhum rótulo quebra em duas linhas.
- **SC-011** — Sitemap com **8 URLs**; `astro check` com 0 erros. *(Corrigido em 2026-08-28: a redação original dizia 9. São 4 de hoje + 4 portões = 8; `/404` nunca entra em sitemap.)*
- **SC-012** — Observação de 2 minutos do painel ocioso sem repetição de combinação das quatro colunas.
- **SC-013** — Nova entrada em `.art/log.json` registrando o que foi construído, o que foi construído **e removido**, e as correções encontradas olhando a tela — não só as previstas.

## Out of Scope

- **Captação de lead.** Sem formulário, sem `/api/lead`, sem `pg`, sem `DATABASE_URL`. `output: "static"` permanece. Se a vertical um dia captar, o caminho é copiar o endpoint do `seguros`.
- **Fotografia** (opção C). Recusada nesta rodada: o site passaria a pesar e não há banco de imagem licenciado no repositório. Fica registrada como movimento seguinte possível.
- **Troca de direção.** A `solari` fica. Esta spec a estende.
- **Mudança de marca ou paleta.** A paleta foi amostrada em pixel das peças reais e não se renegocia aqui.
- **Alternador de tema.** Uma banda só, e a ausência é decisão: o interruptor é o gesto do `coopluz`.
- **Blog, artigos, conteúdo editorial.** Outra spec.
- **Mudança de plataforma de reserva.** A OnerTravel é premissa.

## Riscos declarados

| Risco | Onde mora | Mitigação nesta spec |
|---|---|---|
| **Cosplay de aeroporto** | capa | FR-008, FR-009 e a seção "O que escala de herói NÃO pode significar" — quatro linhas reais, moldura visível, zero coluna fictícia |
| **Quatro portões clonados** | portões | FR-020: objeto e bloco 3 diferentes por portão, com tabela; a violação reprova a spec inteira |
| **CLS morrendo com 4 pás** | capa | FR-012: altura de célula fixa e reservada antes de qualquer animação; SC-004 mede |
| **Rótulo quebrando em 360px** | capa e portões | Edge Cases + SC-010; a mono já quebrou duas vezes por 1px e está no log |
| **Portões terminando todos na mesma URL** | portões | `[NEEDS CLARIFICATION]` de link profundo — resolver testando a plataforma antes do `/plan` |
| **Destino que a busca não vende** | conteúdo | `[NEEDS CLARIFICATION]` das listas — assinar ou cair para país/região |
| **Superfície nova sem grão virando plano chapado** | portões | FR-001 a FR-004; foi exatamente o defeito que a materialização da manhã corrigiu, e nenhum gate o pegou — quem pegou foi olhar a tela |

## Dependencies & Assumptions

- **Depende de:** Astro 5 estático com `@astrojs/vercel` e `@astrojs/sitemap`; `tokens.css` e a lei de matéria já estabelecidos; `logos/contraste.mjs` e `logos/verificar.mjs`; View Transitions e `animation-timeline: view()` nativos, ambos já em uso e ambos com caminho de degradação.
- **Assume que:** a OnerTravel continua sendo a plataforma; a vertical continua self-service; o hub continua sem publicar sub-rotas de viagens; a marca e a paleta continuam as amostradas em ago/2026.
- **Não depende de:** nenhuma dependência nova, nenhum serviço externo novo, nenhuma variável de ambiente além de `SITE_URL`.
- **Fora deste repositório:** confirmar que o hub não passe a publicar `/viagens/*` — é a única forma de esta spec criar canibalização depois de entregue.

## Custo (alvo declarado — medido no fim, não estimado)

```
Faixa: captação
JS adicionado: 0kb gzip (0 deps novas)
Peso novo: 0kb de fonte, 0kb de imagem
LCP: alvo 1500ms · esperado ≤ 800ms · elemento: H1 (cabeçalho do painel)
INP: ≤ 200ms · CLS: ≤ 0.01
Fallback: sem JS a página é idêntica; com reduced-motion o painel nasce
          inteiro e parado, um destino por linha, vinco no lugar
Fora do limiar bom de CWV? não
```

## Review & Acceptance Checklist

- [ ] Nenhum requisito descreve implementação (seletor, arquivo, classe) — só resultado observável
- [ ] Os dois `[NEEDS CLARIFICATION]` resolvidos antes do `/plan`
- [ ] Todo requisito é testável por uma das quatro ferramentas do repositório
- [ ] Os critérios de sucesso têm número, e o número é medido, não estimado
- [ ] O escopo fora está escrito, não subentendido
- [ ] Os gates herdados (G9, G11, G17, G18, G21, G23, G24, G27, G33) têm requisito correspondente
- [ ] A regra de variação dos portões (FR-020) está fechada antes de o primeiro portão ser construído
