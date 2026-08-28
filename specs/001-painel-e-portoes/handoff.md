# Handoff — três pendências abertas de `001-painel-e-portoes`

**Criado**: 2026-08-28 · **Origem**: `/speckit-analyze` da feature
**Estado**: `spec.md` e `tasks.md` já corrigidos e no `main` (commit `bd9602a`).
Estas três **não** foram tocadas porque nenhuma é edição mecânica.

> **Não rodar `/speckit-implement` antes de fechar a C2 e a G4.** A G1/G3 pode ser
> fechada em paralelo com a implementação, mas antes da Phase 6.

**Como retomar**: ler este arquivo, `spec.md`, `plan.md` e `tasks.md` da mesma
pasta. O relatório completo do `/speckit-analyze` não foi salvo — o que sobreviveu
dele é o que está aqui e as correções já commitadas.

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

---

## Ordem sugerida

1. **C2** primeiro — é meia hora e destrava a autoridade de todo o resto.
2. **G4** — precisa de decisão do dono, e é a única que pode mudar o desenho.
   Construir a opção 2, olhar, decidir.
3. **G1/G3** — corrigir a "correção 3" do `plan.md`, reescrever T053/T054 com as
   quatro decisões acima, e fixar o engine de T051. Pode andar em paralelo com a
   US1.

## Achados MEDIUM/LOW que ficaram registrados e não viraram tarefa

Nenhum bloqueia; entram quando a tarefa vizinha for tocada.

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
- **A2** — `research.md` §R5 escreve `--vt-aer`; contrato e T047 escrevem
  `vt-aer`. Os dois são ident válido, mas o nome precisa **casar entre os dois
  documentos** para o par existir. Fixar `vt-aer`.
- **G6** — FR-033 (FAQ visível e `FAQPage` da mesma lista) é o único FR sem
  tarefa. Inerte: nenhum portão ganha FAQ nesta feature.
