# Handoff — três pendências de `001-painel-e-portoes` · **FECHADAS**

**Criado**: 2026-08-28 · **Origem**: `/speckit-analyze` da feature
**Fechado**: 2026-08-28 · **Estado**: as três resolvidas. `/speckit-implement`
está **liberado**.

| # | O que era | Onde ficou a resolução |
|---|---|---|
| **C2** | a constituição afirmava que a feature estava implementada e isenta do gate | emenda PATCH **1.0.0 → 1.0.1** em `.specify/memory/constitution.md` |
| **G4** | os três nomes de transição sem par desbotavam | **opção 2**, medida em quadro congelado. `contracts/coreografia.md` §3 · T047a · T047b · FR-025 · FR-028 |
| **G1/G3** | `verificar.mjs` cobre 1 rota; SC-009 sem método | `plan.md` correção 3 · T001 · T053 · T054 · T051 · SC-009 |

Ajustes vizinhos que entraram junto, porque a tarefa deles foi tocada: **A2**
(`--vt-aer` → `vt-aer` em `research.md` §R5), **I6** (360×**640** no laço) e
**I8** (largura **736**, o breakpoint real de `46rem`).

O que **não** foi feito, de propósito: nenhuma linha de `src/`. A feature
continua não implementada — as três pendências eram decisões e contratos, e o
código delas é T047a/T047b/T051/T053/T054 nas Phases 5 e 6.

O registro original das três, com o diagnóstico completo, segue abaixo — com o
veredito de cada uma no fim da seção.

---

## C2 — A constituição afirma um estado que não ocorreu

**Severidade**: CRITICAL · **Arquivo**: `.specify/memory/constitution.md`, Sync
Impact Report no topo (bloco de comentário HTML)

### O problema

A linha diz, sobre esta feature:

> ⚠ `specs/001-painel-e-portoes/spec.md` — escrito antes desta ratificação e sem
> "Constitution Check". Não há ação retroativa: **a feature está implementada e
> verificada**. O portão vale da próxima `/speckit-plan` em diante.

É falso, e foi verificado em 2026-08-28:

| Afirmação | O repositório |
|---|---|
| feature implementada | não existem `src/pages/passagens-aereas.astro`, `hoteis.astro`, `pacotes.astro`, `aluguel-de-carro.astro` |
| — | `export const DESTINOS` continua vivo em `src/data/conteudo.ts:57` |
| — | `global.css:516` tem **um** `@keyframes ciclo`, não quatro |
| — | `dist/sitemap-0.xml` tem 4 URLs |
| sem Constitution Check | `plan.md` **tem** a seção, com os seis princípios avaliados antes da Phase 0 e depois da Phase 1 |

Dois danos: (a) o documento de governança do repositório afirma um estado que não
ocorreu — que é exatamente o que o Princípio IV proíbe as telas de fazer; (b) a
frase **isenta esta feature** do gate de conformidade, e o `plan.md` fez o check
mesmo assim. Enquanto isso estiver escrito, nenhum Constitution Check deste repo
tem autoridade.

### O que fazer

Emenda **PATCH** (1.0.0 → 1.0.1) por `/speckit-constitution`. Não é mudança de
princípio — é correção de fato no Sync Impact Report. Redação sugerida para
substituir o ⚠:

> ✅ `specs/001-painel-e-portoes/spec.md` — escrita em 2026-08-27, antes desta
> ratificação. A spec em si não tem seção "Constitution Check", mas o
> `plan.md` de 2026-08-28 avaliou os seis princípios antes da Phase 0 e depois
> da Phase 1, com veredito de passagem sem violação. A feature **não está
> implementada**: nenhuma das quatro rotas existe. O portão vale desta feature
> em diante, e ela já o cumpriu.

Registrar na própria emenda por que o PATCH existe: uma constituição que erra
sobre o estado do repositório é pior que uma sem a nota.

### Fechada em 2026-08-28

As quatro afirmações da tabela foram re-verificadas antes de escrever a emenda:
`src/pages/` tem 7 arquivos e **nenhuma** das quatro rotas; `DESTINOS` continua em
`conteudo.ts:57`; `global.css` tem **um** `@keyframes ciclo`; `dist/sitemap-0.xml`
tem 4 `<loc>`.

Feito: `.specify/memory/constitution.md` em **1.0.1**. O aviso virou confirmação,
com a redação sugerida; o Sync Impact Report ganhou o bloco do PATCH dizendo o que
era falso, o que foi verificado, por que a emenda existe (*"uma constituição que
erra sobre o estado do repositório é pior que uma sem a nota"*) e que **nada passa
a ser permitido em consequência** — a governança exige isso de toda emenda. O
1.0.0 virou linha de histórico em vez de ser sobrescrito. Rodapé em
`**Version**: 1.0.1`.

---

## G4 — As três colunas sem par desbotam na transição de rota

**Severidade**: HIGH · **Bloqueia**: T047 · **Toca**: FR-025, FR-026, FR-028,
`contracts/coreografia.md` §3, e a regra de direção da constituição

### O problema

FR-025 e T047 mandam pôr `view-transition-name: vt-<codigo>` na coluna de destino
**de cada linha da capa** (são quatro: `vt-aer`, `vt-htl`, `vt-pct`, `vt-car`) e no
objeto da cabeça do portão correspondente (é **um** por portão).

Numa navegação capa → `/passagens-aereas`, o documento novo tem só `vt-aer`. Os
outros três nomes existem no documento velho e não têm par no novo — o navegador
aplica neles o `-ua-view-transition-fade-out` padrão. **As outras três colunas
desbotam.** A constituição, em "Restrições de Stack, Conteúdo e Direção":

> O verbo da página é **virar**, não desbotar (…) Não MUST haver fade em nenhuma
> camada.

Nenhum FR, contrato ou tarefa diz o que acontece com os três não-ativados.

### O que já está no CSS hoje (importa para a solução)

`src/styles/global.css`:

- `:238` — `@view-transition { navigation: auto }`, já declarado
- `:243-246` — `::view-transition-old(corpo)` / `-new(corpo)` com animações
  próprias: `pa-sai` vai para `rotateX(38deg)` + `opacity: 0`. Ou seja: **o fade
  já existe hoje, mas acoplado ao giro** — a leitura vigente da regra é "fade
  junto com o virar, sim; fade sozinho, não". Um `fade-out` puro nas três colunas
  é o caso proibido.
- `:348` — `view-transition-name: faixa` (a faixa de estado, que FR-026 manda
  manter)
- `:1096` — **`main { view-transition-name: corpo }`**

O `:1096` é a pegadinha: um elemento com `view-transition-name` próprio é
**retirado do snapshot do ancestral**. Dar nome às quatro colunas abre quatro
buracos no snapshot `corpo` da capa, e as quatro passam a animar por fora do
`pa-sai`. Isso não está escrito em lugar nenhum e muda o desenho da camada 4.

### As opções (escolher uma antes de T047)

1. **Nomear só a linha ativada.** É o correto conceitualmente, e é o difícil sem
   JS: o nome precisa estar no CSS da página de origem antes da navegação
   começar. Caminhos possíveis a investigar — `:active-view-transition-type()`,
   ou marcar a linha via `:target`/`:focus-visible`. Se nenhum funcionar sem
   JavaScript, **FR-039 manda cortar o requisito, não o orçamento**.
2. **Manter os quatro nomes e sobrescrever a saída dos três.** Um
   `::view-transition-old(vt-htl)` etc. com o gesto de virar em vez do fade
   padrão. Custa 0 byte e é a opção lazy — mas os três giram sem motivo visível,
   o que pode ler como ruído. Olhar antes de aceitar.
3. **Só a faixa e o `corpo` atravessam; a coluna não ganha nome.** Mata FR-025 —
   e FR-025 é a única entrega que justifica A e B serem uma spec só. Só considerar
   se 1 e 2 falharem no olho.

**Método**: construir a opção 2 primeiro (é uma dúzia de linhas de CSS), olhar a
transição nas duas direções, e só então decidir. `logos/verificar.mjs` já sabe
congelar quadro pela Web Animations API — é o mesmo instrumento.

### Fechada em 2026-08-28 — **opção 2**, e ela não é o consolo

O método foi seguido: protótipo de dois documentos (capa com as quatro colunas
nomeadas + portão com uma), servido contra o `global.css` real, transição
congelada pela Web Animations API a partir de `pagereveal`. Duas variantes lado a
lado — sem regra (o estado contratado hoje) e com a opção 2.

**O que o quadro mostrou, e é pior do que "desbotam":**

| t | `::view-transition-old(corpo)` | os três sem par |
|---|---|---|
| 60 ms | op 0,22 · `matrix3d`, girando | op 0,61 · **`transform: none`** |
| 140 ms | op 0,02 — já saiu | op 0,14 · ainda **nítidos, retos, legíveis** |

Sem `::view-transition-group`, os três não herdam nada do `corpo`. No quadro de
140ms o corpo da capa já saiu e LISBOA, PORTO SEGURO e SANTIAGO continuam de pé,
sozinhos, sobre a página do portão. Não é um fade indevido — é um rasgo, e são as
últimas coisas a sair.

**A opção 1 não existe sem JS**, e a investigação fechou os três caminhos: as
`types` de `@view-transition` são estáticas por documento (iguais para os quatro
links), `:target` precisa de um fragmento que não há, e `:focus-visible` não
dispara em clique de ponteiro. FR-039 mandaria cortar o requisito — mas não
precisou.

**A opção 2 não lê como ruído**, e a razão é o inverso do que o receio supunha: os
três não *ganham* um giro, eles **param de ficar para trás**. Com `pa-sai` neles,
saem em lockstep com o corpo de onde foram recortados e no quadro congelado ficam
indistinguíveis dele. E ela consertou mais do que os três: o par (`vt-aer`) também
saía com `-ua-view-transition-fade-out` + `plus-lighter` — o fade estava no
elemento principal do gesto também. Agora o `::view-transition-group` segue
morfando a posição (712 px → 121 px, medido) enquanto a peça **vira**.

**Achado colateral, e é uma falha contratada:** sob `prefers-reduced-motion:
reduce` a transição de rota **não está desligada**. As regras do `corpo` moram
dentro de `@media (prefers-reduced-motion: no-preference)`, então sob `reduce`
elas não se aplicam e sobra o cross-fade **padrão do navegador** nos cinco nomes,
com os grupos ainda transladando. O caminho de acessibilidade é hoje a versão
*mais* cheia de fade da página, e FR-028 diz o contrário. Corrigido por regra
própria (`::view-transition-*(*) { animation: none !important }`, com o `*`
confirmado suportado): medido depois, **zero** animação de pseudo-elemento e a
página de destino inteira no primeiro quadro.

Escrito em: `contracts/coreografia.md` §3 (as duas cláusulas + a tabela de
engines), **T047a** e **T047b** (novas), FR-025 e FR-028 (aditados), `research.md`
§R5. Custo do conjunto: **0 byte** enviado ao cliente.

---

## G1 / G3 — `verificar.mjs` cobre uma rota, e SC-009 não tem método

**Severidade**: HIGH · **Toca**: T001, T053, T054, T051 · **Arquivo**:
`logos/verificar.mjs`

### G1 — a linha de base é 1, não 5

SC-002 dizia "5 rotas × 3 larguras × 4 posições" e a "correção 3" do `plan.md`
tratou o 5 como a contagem de hoje. **Não é.** O script visita a capa e só ela:

| Linha | O que faz |
|---|---|
| `:66-69` | laço de 3 larguras (`360×780`, `768×1024`, `1440×900`) |
| `:77` | `pagina.goto(base, …)` — `base` é a raiz, sem laço de rota |
| `:81` | 4 posições de rolagem, dentro da largura |
| `:101`, `:135`, `:180`, `:200` | quadros especiais (hover, queda da pá, reduced-motion) — **todos amarrados à capa**, 1440×900 |
| `:29` | `ORCAMENTO = { lcp: 1500, cls: 0.05, js: 0 }` — um número global |
| `:229` | 5 amostras de LCP/CLS, de uma página só |

`spec.md` já foi corrigido (SC-002 = 9 rotas, com a linha de base registrada como
1). Falta o `plan.md`, cuja "correção 3" ainda repete o 5, e falta reescrever
T053: **não é parametrizar um laço, é criar um.** Decisões que a tarefa nova
precisa tomar:

- quais dos quadros especiais valem por rota e quais só na capa (hover e queda
  da pá só fazem sentido onde há coluna girando: capa + as quatro cabeças de
  portão; reduced-motion, SC-008, é **por rota**);
- nomenclatura dos screenshots — hoje é `{largura}-{pct}.png` em
  `logos/_verificacao/`, e com 9 rotas colide;
- `ORCAMENTO` passa a ser por rota ou continua global? SC-003 diz "LCP mediano
  ≤ 800ms **por rota**" — um número global não prova isso;
- 9 rotas × 3 larguras × 4 rolagens + especiais vai ficar lento. O `plan.md` já
  decidiu: *"é custo de ferramenta, não de página; se incomodar, a saída é
  paralelizar, **não** reduzir a cobertura."*

Dois ajustes menores que cabem na mesma passada:

- **I6** — FR-011 e T042 nomeiam **360×640** como o caso a provar (quarta linha
  visível ou meio-visível); o laço mede 360×**780**. 140px é exatamente onde a
  quarta linha some. Acrescentar a altura ou corrigir o FR.
- **I8** — o breakpoint é `46rem` = **736px**; o laço mede 768. A faixa 736–767
  nunca é fotografada, e é o lado largo logo acima da virada de FR-013.

### G3 — SC-009 exige provar a degradação, e não existe método

SC-009: *"um caminho de degradação limpa **provado** em navegador sem View
Transitions"*. T050 e T051 não nomeiam o mecanismo, e `verificar.mjs` sobe
`chromium`, que suporta VT — a rodada nunca exercita o caminho.

Bom: **os engines já estão instalados** no cache local do Playwright
(`firefox-1497`, `webkit-2227`, além do chromium). O caminho mais barato é
importar `firefox` de `playwright` em `verificar.mjs` e rodar **só a passagem de
navegação** (capa → um portão) nele: nenhuma transição, console limpo, conteúdo
inteiro do outro lado. Confirmar antes que a versão de Firefox instalada de fato
não faz view transition **cross-document** — se fizer, o engine sem suporte passa
a ser outro, ou a prova vira "regra removida do CSS servido".

Escrever o mecanismo escolhido dentro de T051. Critério medível sem método de
medição é caixa marcada no olho, que é o que esta spec inteira existe para não
fazer.

### Fechadas em 2026-08-28

**G1.** `plan.md` correção 3 reescrita: o `5` não era a contagem de antes da
feature nem de coisa nenhuma — **a linha de base é 1**. T001 corrigido no mesmo
sentido ("rotas verificadas (hoje **1**)"). **T053 reescrito**: é criar o laço,
não parametrizá-lo, com as quatro decisões tomadas por escrito —

1. *quais especiais por rota*: `reduced-motion` e teclado por rota (9); `hover` e
   `queda da pá` só onde há coluna girando — capa + as quatro cabeças (5). O
   quadro da transição e o da degradação saem para T051.
2. *nomenclatura*: `{rota}-{largura}-{pct}.png`, com `capa` para `/` e `404` para
   `/404`; especiais em `{rota}-{largura}-{quadro}`.
3. *`ORCAMENTO` por rota* — SC-003 diz "por rota" e um número global deixa a capa
   segurar a mediana de um portão lento. T054 reescrito junto, e a mensagem de
   falha passa a nomear **qual** rota estourou.
4. *lentidão*: paralelizar por rota com teto de 4 — **menos** o bloco de LCP/CLS,
   que roda serial, porque medida sob contenção não é medida.

**I6** e **I8** entraram no mesmo laço: 360 ganha as duas alturas (**640**, que é
o que FR-011 contrata, e 780), e **736** entra na lista de larguras — é o
breakpoint real de `46rem`, e a faixa 736–767 nunca era fotografada.

**G3.** O engine foi **confirmado, não suposto** — e a suposição do handoff estava
meio certa:

| Engine | `view-transition-name` | `startViewTransition` | `onpagereveal` | VT cross-document |
|---|---|---|---|---|
| Chromium 143 | sim | sim | sim | **sim** |
| WebKit 26 | sim | sim | sim | **sim** — não serve de prova |
| Firefox 144 | **sim** | **sim** | não | **não** — é a prova |

O Firefox é a prova: navegação normal, nenhum `pagereveal`, nenhum `pageswap`,
console limpo, `h1` e objeto da cabeça inteiros do outro lado. **A pegadinha que
entrou em T051**: ele suporta `view-transition-name` e
`document.startViewTransition` — um teste de suporte por `CSS.supports` dá **falso
positivo** ali. O que separa os dois grupos é `"onpagereveal" in window`, e é isso
que a asserção lê; se o Firefox um dia passar a fazer VT cross-document, essa
asserção quebra sozinha e avisa que o engine da prova mudou. T051 também ganhou o
método do quadro congelado (gancho `pagereveal` → `viewTransition.ready` → pausar
e rebobinar; **um contexto novo por quadro**, porque o documento congelado fica
com uma transição ativa que nunca termina e faz o Chromium pular a transição
seguinte) e a asserção que faz o G4 falhar se voltar: nenhum
`::view-transition-old(vt-*)` pode estar rodando `-ua-view-transition-fade-out`.
SC-009 no `spec.md` carrega o método.

---

## Ordem sugerida — cumprida nesta ordem

1. ~~**C2** primeiro~~ — feita. Emenda 1.0.1.
2. ~~**G4**~~ — feita. Opção 2 construída, congelada, olhada e escrita. Mais o
   desligamento sob `reduce`, que ninguém tinha visto.
3. ~~**G1/G3**~~ — feitas. `plan.md`, T001, T053, T054, T051, SC-009, mais I6, I8
   e A2.

## Achados MEDIUM/LOW que ficaram registrados e não viraram tarefa

Nenhum bloqueia; entram quando a tarefa vizinha for tocada. **A2, I6 e I8 saíram
desta lista** — a tarefa vizinha deles foi tocada agora e eles entraram junto. O
resto continua aberto.

- **I4** — FR-041, T034 e `contracts/rotas.md` §4 mandam pôr as quatro rotas no
  `robots.txt`. O arquivo (`src/pages/robots.txt.ts`) é `User-agent: * / Allow: /
  / Sitemap:` — não tem lista de rotas, e o próprio comentário dele diz que
  "escrever uma regra para um caminho que não existe é instrução morta". Tirar o
  `robots.txt` de FR-041 e de T034.
- **U1** — T025 manda editar `Base.astro` para o nó `Service`, mas o layout
  **já** aceita nós extras por página (`Props`, comentário: *"Nós extras do
  @graph (FAQPage, Service…)"*). O nó nasce na página. E ninguém decidiu se o
  portão passa `trilha` (`BreadcrumbList` no JSON-LD) — FR-019 proíbe o
  breadcrumb **visual** e cala sobre o estruturado.
- **G5** — o "achado colateral" de `research.md` §R1 (a plataforma vende **seis**
  produtos, este site cobre **quatro**; nenhum portão pode sugerir que cobre os
  seis nem que seguro se compra aqui) está no contrato de schema §4 e **não tem
  tarefa nem teste**. Cabe em T020 e numa linha do V6 (T036).
- **G2** — o Princípio VI exige a ausência de preço declarada "primeira tela,
  /sobre, Termos, rodapé e llms.txt". Os quatro portões passam a ser a primeira
  tela do tráfego orgânico e nenhuma tarefa exige a declaração ali. Cabe na
  `FICHA` (T021) ou no bloco 5 (T029).
- **C3** — a constituição exige `design-review`, `accessibility` e
  `ui-verification` com evidência; nenhuma das 61 tarefas invoca skill alguma.
- **D1** — a tabela das quatro porcentagens de keyframe está duplicada verbatim
  em `data-model.md` §3 e `contracts/coreografia.md` §2. V3 só compara
  `global.css` contra a fórmula — os dois documentos podem divergir em silêncio.
- **A1** — FR-009 ("`--fundo` respirando fora da moldura") é a única regra
  geométrica sem número na spec. T041 já ganhou a nota; falta o valor.
- ~~**A2**~~ — feito. Fixado `vt-aer` em `research.md` §R5 e nomeado em T047. Os
  dois são ident válido, e é por isso que a divergência passaria calada.
- **G6** — FR-033 (FAQ visível e `FAQPage` da mesma lista) é o único FR sem
  tarefa. Inerte: nenhum portão ganha FAQ nesta feature.
