---
description: "Task list — o saguão: painel de partidas e quatro portões de embarque"
---

# Tasks: o saguão — painel de partidas em escala de herói e quatro portões de embarque

**Feature**: `001-painel-e-portoes` · **Data**: 2026-08-28
**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: **obrigatórios.** Não são opcionais nesta feature — a spec os pede por
nome (SC-006, SC-011), o `data-model.md` §7 lista dez invariantes verificáveis, e
`test/placa.test.mjs` já existe exatamente porque esta é a lógica que quebra em
silêncio. As tarefas de teste vêm **antes** do CSS que elas verificam (ordem da
etapa 2 do plan).

**Organização**: agrupadas por história, na ordem em que cada uma **pode ser
provada**. A ordem das histórias não é a ordem de importância — é a ordem de
dependência: o painel só pode virar link interno depois de existir para onde
apontar, e a transição só existe depois das duas pontas.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência)
- **[História]**: US1 (portões), US2 (painel), US3 (transição)
- Caminho de arquivo exato em toda tarefa

## Convenções de caminho

Projeto único Astro estático na raiz: `src/`, `test/`, `logos/`.
Nenhum diretório novo (Structure Decision do `plan.md`).

---

## Phase 1: Setup

**Propósito**: linha de base medida. Não há scaffolding — o projeto existe, as
quatro ferramentas existem, e nenhuma dependência entra (FR-040).

- [ ] **T001** Rodar a sequência inteira do `quickstart.md` no estado atual
      (`npm test`, `npm run check`, `npm run contraste`, `npm run build`,
      `npm run verificar`) e anotar os números de partida: pares de contraste
      medidos (hoje 37), URLs no sitemap (hoje 4), rotas verificadas (hoje 5),
      LCP e CLS por rota. É contra estes números que SC-001, SC-011 e SC-002 vão
      ser lidos no fim — sem a linha de base, "subiu de 37 para ≥45" não é
      verificável.
- [ ] **T002** Confirmar no `astro.config.mjs` do **hub** que `/viagens/*` não
      publica sub-rota alguma, e que os quatro slugs de FR-015 não colidem com
      URL viva (contrato `rotas.md` §1). Registrar o que foi visto. Repetir
      antes do merge (T060) — é a única forma de esta feature criar
      canibalização depois de entregue.

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Propósito**: o dado, os tipos, os tokens, as quatro tabelas de keyframe e os
testes que as guardam. Tudo que as três histórias leem.

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase fechar.

### Dado e tipos

- [ ] **T003** Em `src/data/conteudo.ts`, declarar o tipo `Produto`
      (`data-model.md` §1) com os quatro campos novos — `rota`, `destinos`,
      `objeto`, `detalhe` — e aplicá-lo a `PRODUTOS`. `objeto` e `detalhe` são
      uniões literais fechadas; o tipo é o que faz `npm run check` pegar um
      quinto valor inventado.
- [ ] **T004** Em `src/data/conteudo.ts`, preencher os quatro produtos com
      `rota` (`/passagens-aereas`, `/hoteis`, `/pacotes`, `/aluguel-de-carro`),
      `objeto` (`par` / `faixa` / `duasMetades` / `campoUnico`) e `detalhe`
      (`comparacao` / `estados` / `duasColunas` / `grade`), conforme a tabela de
      instâncias do `data-model.md` §1.
- [ ] **T005** Em `src/data/conteudo.ts`, escrever as quatro listas
      `destinos` (11 / 8 / 7 / 5 nomes, `data-model.md` §2) e **apagar
      `export const DESTINOS`**. Só país e região, caixa alta, ≤ 12 caracteres,
      nenhuma cidade — a regra vem de R2 e do Princípio VI, não de gosto.
- [ ] **T006** Em `src/pages/index.astro`, apontar o widget `.destino` que ainda
      existe para `PRODUTOS[0].destinos` (AER, 11 nomes) e trocar a animação
      para `ciclo-11`. É uma ligação **temporária de uma linha**, para o build
      continuar verde entre esta fase e a US2, que remove o widget inteiro
      (**T038**, não T035 — T035 é o teste de sitemap). **Depende de T008**:
      `ciclo-11` só nasce com as quatro tabelas, e `animation-name` desconhecido
      não anima, não erra no console e não quebra o build — a classe exata de
      defeito que esta feature diz temer. Marcar com um comentário `ponytail:`
      que nomeie o teto (widget vivo com uma lista só) e a saída (morre em
      T038).

### Tokens e as quatro tabelas de keyframe

> **Não execute nesta posição.** T007–T010 vêm **depois** de T011–T018 — a ordem
> que vale é a de "Dentro da Foundational", não a numérica. Estão escritas aqui
> porque são o mesmo assunto; são executadas depois de o teste ter mostrado
> vermelho.

- [ ] **T007** Em `src/styles/tokens.css`, remover `--pa-total` (era
      `--pa-parada × 8`, e não existe mais um único N) e acrescentar
      `--pa-cascata: 120ms` (FR-006). `--pa-parada: 2.2s` e `--pa-giro: 0.176s`
      ficam como estão — a velocidade do giro é a mesma nas quatro colunas
      (cláusula da velocidade única, `contracts/coreografia.md` §2).
- [ ] **T008** Em `src/styles/global.css`, substituir `@keyframes ciclo` pelas
      **quatro** tabelas `ciclo-5`, `ciclo-7`, `ciclo-8` e `ciclo-11`, com as
      porcentagens da tabela de `contracts/coreografia.md` §2. Em cada uma, a
      saída **vaza além** do slot da pá e se sobrepõe à entrada da seguinte —
      contida no slot, a janela pisca em branco a cada troca. Escrever a
      fórmula (`giro% = 8/N`) em comentário ao lado.
- [ ] **T009** Em `src/styles/global.css`, generalizar a coluna que vira
      (`.destino__janela` / `.destino__pa`) numa classe reusável de coluna de
      destino, com altura de célula fixa reservada antes de qualquer animação
      (FR-012, M7) e `aria-hidden` no elemento que vira mais o equivalente em
      texto para leitor de tela (FR-037). Ela é usada 8× depois: 4 linhas do
      painel e 4 cabeças de portão.
- [ ] **T010** Em `src/styles/global.css`, escrever o bloco
      `prefers-reduced-motion: reduce` da coluna nova **no mesmo commit** que a
      animação (FR-036): um destino visível por coluna, parado, vinco e moldura
      no lugar. Nenhum `filter`/`backdrop-filter` dentro de keyframe (FR-038).

### Os testes, antes do CSS que eles guardam

> Escritos para **falhar** contra o estado atual. Esta é a única ordem que
> garante que a fórmula das tabelas está no teste, e não só na cabeça de quem
> escreveu o CSS (etapa 2 do `plan.md`).

- [ ] **T011** **Primeira tarefa da fase** (ver "Dentro da Foundational"). Em
      `test/placa.test.mjs`, reescrever a leitura do dado, três coisas:
      (a) mover a leitura para **dentro** dos testes — hoje ela é um
      `assert.ok(destinos, …)` no topo do módulo, então basta `DESTINOS` sumir
      (T005) para a suíte **estourar na importação** em vez de falhar em quatro
      testes, e T018 não veria vermelho, veria erro de carga;
      (b) as quatro listas passam a ser extraídas de `PRODUTOS` em
      `src/data/conteudo.ts`, e `DESTINOS` sai;
      (c) `--pa-total` sai da leitura (T007 o remove — não existe mais um único
      N) e a asserção de marcação que casa `/DESTINOS\.map\(\(d, i\) =>/` em
      `index.astro` passa a casar a lista nova. Sem (c), dois testes que estão
      verdes hoje ficam vermelhos por motivo errado.
- [ ] **T012** **V1** — teste em `test/placa.test.mjs`: `objeto` e `detalhe` têm
      quatro valores **distintos** entre os quatro produtos (FR-020). Valor
      repetido = dois portões com o mesmo desenho, e isso reprova a spec
      inteira.
- [ ] **T013** **V3** — teste em `test/placa.test.mjs`: recalcular as quatro
      tabelas de keyframe pela fórmula, a partir de `--pa-parada` e `--pa-giro`
      lidos de `tokens.css` e dos comprimentos **reais** das quatro listas, e
      comparar com o que está em `global.css`. É a tarefa que carrega o maior
      risco técnico da feature (`plan.md`, tabela de riscos).
- [ ] **T014** **V2** — estender o teste da sobreposição para as quatro tabelas:
      em cada `ciclo-N`, a saída termina **depois** de `100/N %`. O teste falha
      se alguém "consertar" a sobreposição.
- [ ] **T015** **V4** — teste: os quatro comprimentos são coprimos dois a dois e
      `mmc × --pa-parada ≥ 3600s` (FR-005). Com 5/7/8/11 dá 1h52min56s.
- [ ] **T016** **V5** — teste: todo destino tem ≤ 12 caracteres, está em caixa
      alta, sem pontuação além de hífen, e não é nome de cidade (lista fechada
      de exceções vazia). Nenhum nome repetido **dentro** da mesma lista.
- [ ] **T017** **V7** — estender o teste de CTA: todo link externo aponta para
      `EXTERNOS.busca`, e nenhuma página escreve `onertravel` à mão. Reprovar
      explicitamente `flight-list`, `hotel-list`, `car-list` e `combined` —
      são as URLs que dizem "nenhum voo foi encontrado" a quem não buscou
      (R1 · Princípio IV).
- [ ] **T018** Rodar `npm test` **duas vezes**, e ver o vermelho antes do
      verde. Primeira, logo depois de T012–T017 e **antes de T003–T010**: V1,
      V3, V4 e V5 falham — nem o dado nem as tabelas existem. Segunda, depois de
      T003–T005: V1, V4 e V5 ficam verdes e **V3 e V2 continuam vermelhos** até
      T007–T008 entregarem as quatro tabelas. Sem as duas passagens o teste não
      prova nada — prova só que foi escrito depois.
- [ ] **T019** `npm run check` limpo (0 erros) com `DESTINOS` já removido.

**Checkpoint**: dado, tipos, tokens, keyframes e testes de pé. As três
histórias podem começar.

---

## Phase 3: User Story 1 — Os quatro portões (Prioridade: P1) 🎯 MVP

**Objetivo**: quem cai de busca orgânica em `/passagens-aereas` às 22h no
celular entende em cinco segundos que ali se compara passagem, encontra o que a
busca cobre, e sai para a plataforma sabendo por que a marca do outro lado é
diferente. É a Primary User Story da spec, palavra por palavra.

**Teste independente**: abrir cada uma das quatro rotas **direto**, sem passar
pela capa. Cada portão se explica sozinho: H1 único, BLUF no primeiro parágrafo,
quem opera o site, e a linha de placa de volta ao painel. A capa continua como
está — esta história não a toca.

**Por que é o MVP e não o painel**: é o tráfego que existe hoje (portão aberto
direto é o caso mais comum, Edge Cases da spec), e é a única história entregável
sem quebrar nada — o painel só pode virar link interno depois destas quatro
rotas existirem.

### Conteúdo dos portões (dado antes de forma — FR-032)

- [ ] **T020** [P] [US1] Em `src/data/conteudo.ts`, `COBERTURA[codigo]:
      string[]` — a lista densa do bloco 2 dos quatro portões. Zero card, zero
      ícone de linha (FR-016 §2).
- [ ] **T021** [P] [US1] Em `src/data/conteudo.ts`, `FICHA[codigo]:
      {rotulo, valor, fonte?}[]` — a tabela de fatos do bloco 4: abrangência,
      formas de pagamento, prazo de emissão, quem emite, quem opera o site.
      **Toda alegação verificável carrega `fonte`** (FR-031 · Princípio VI); o
      padrão é o que o FAQ já usa com `EXTERNOS.susepConsulta`.
- [ ] **T022** [P] [US1] Em `src/data/conteudo.ts`, os dados do bloco 3, um por
      portão, cada um com forma própria (`data-model.md` §4.1): AER `string[]`
      de companhias; HTL `{regime, oQueInclui}[]`; PCT
      `{entra: string[], naoEntra: string[]}`; CAR `{iata, cidade}[]`. Nome de
      terceiro em **tipografia, nunca logotipo** (FR-021).
- [ ] **T023** [P] [US1] Em `src/data/conteudo.ts`, `titulo`, `descricao` e
      `bluf` próprios por portão (`data-model.md` §4.2). Nenhum herda o
      `<title>` da capa; a `descricao` vende o clique e o `bluf` responde a
      pergunta — são textos diferentes, de propósito.
- [ ] **T024** [US1] Em `src/consts.ts`, acrescentar ao comentário de
      `EXTERNOS.busca` a razão **medida** de ela continuar sendo uma URL só (R1:
      a plataforma não aceita link profundo utilizável). Nenhum valor muda.

### Esqueleto das quatro rotas

- [ ] **T025** [US1] Em `src/layouts/Base.astro`, acrescentar ao `@graph` o nó
      `Service` por portão, conforme `contracts/dados-estruturados.md` §2:
      `@id` único com `#servico`, `provider` como **referência** ao
      `/#agencia` existente, `description` = o BLUF palavra por palavra. Nenhum
      `offers`, `price`, `priceRange` ou `priceSpecification` — em texto ou em
      schema (S4).
- [ ] **T026** [US1] Em `src/styles/global.css`, a macroestrutura `.portao`:
      cinco blocos, diferente do Índice da capa e do `.doc` das fichas legais
      (FR-017 · G33). Filete é fresta em superfície de painel (M3); sombra sai
      de `--sombra-cor` a 200° (M1, M2); o grão continua sendo **uma** camada
      `fixed` — nenhum `::after` novo (M4). Declarar qual anel de foco cada
      superfície nova usa (FR-035).
      **Antes de qualquer par de cor novo entrar neste CSS**: acrescentá-lo a
      `logos/contraste.mjs`, rodar `npm run contraste` e escrever o valor medido
      em comentário ao lado da declaração. O Princípio V diz *antes*, não no
      fim — T052 só conta o total; medir lá é medir depois de a tela existir,
      que é quando trocar a cor custa dez vezes mais.
- [ ] **T027** [US1] `src/components/CabecaDePortao.astro` — bloco 1: o código
      do produto em escala de objeto, como pá que acabou de travar, com a coluna
      de destino daquele produto virando. A forma varia por `produto.objeto`
      (quatro valores, quatro desenhos). Reusa a coluna de T009.
- [ ] **T028** [US1] A linha de placa de volta ao painel (`href="/"`), na mesma
      posição nos quatro portões — **não** breadcrumb, **não** botão "voltar"
      (FR-019). Faixa de estado e rodapé de uma linha mantidos (FR-018).
- [ ] **T029** [US1] Bloco 5 ("Ação") comum aos quatro: a tecla apontando para
      `EXTERNOS.busca` em nova aba (`target="_blank" rel="noopener"`), com a
      advertência de aba nova e de mudança de ambiente visual (FR-023). O texto
      **não promete filtro**: diz que a aba de produto se escolhe do outro lado
      (correção 1 do `plan.md`). Nada de "emenda visual" em degradê — já foi
      construída e removida uma vez; quem faz esse trabalho é a frase.

### Os quatro portões, um por vez, cada um até o fim

> Construir os quatro blocos 1 e depois os quatro blocos 2 é o caminho mais
> curto para quatro páginas clonadas — que reprovam a spec inteira por FR-020
> (etapa 5 do `plan.md`). Estas quatro tarefas **não** são `[P]`.

- [ ] **T030** [US1] `src/pages/passagens-aereas.astro` completo, os cinco
      blocos: cabeça com **par de pás** (ida ‖ volta), cobertura, bloco 3
      `comparacao` (companhias lado a lado, tipografia), ficha, ação.
- [ ] **T031** [US1] `src/pages/hoteis.astro` completo: cabeça com **pá única
      sobre faixa de noites**, cobertura, bloco 3 `estados` (regimes como quatro
      estados da mesma pá), ficha, ação.
- [ ] **T032** [US1] `src/pages/pacotes.astro` completo: cabeça com **pá de duas
      metades** — voo em cima, hotel embaixo, o vinco é a emenda —, cobertura,
      bloco 3 `duasColunas` (entra ‖ não entra, em fresta), ficha, ação. É a
      peça em que a direção se prova (FR-022): a matéria carrega o argumento, o
      texto não repete o que a peça já diz.
- [ ] **T033** [US1] `src/pages/aluguel-de-carro.astro` completo: cabeça com
      **campo único** (retirada e devolução no mesmo campo), cobertura, bloco 3
      `grade` (aeroportos de retirada em códigos IATA), ficha, ação.

### Publicação das rotas

- [ ] **T034** [US1] `src/pages/llms.txt.ts` e `src/pages/robots.txt.ts`: as
      quatro rotas novas nas duas listas (FR-041). No `llms.txt`, a declaração
      em maiúsculas sobre ausência de preço passa a valer explicitamente para as
      nove rotas, e continua declarado que o número de Cadastur **não** está
      publicado.
- [ ] **T035** [US1] **V8** — teste em `test/placa.test.mjs`: quatro rotas,
      quatro slugs únicos, sem colisão; e `npm run build` produzindo
      **8 URLs no sitemap** (`dist/sitemap-0.xml`), com `/404` fora dele.
      Corrige o "9" de SC-011 (correção 2 do `plan.md`).
- [ ] **T036** [US1] **V6** — estender o teste de conteúdo servido para ler o
      `dist` (não a fonte) e falhar com `R$`, com hora de voo (`HH:MM` em
      contexto de painel) e com número de voo, nas nove rotas (FR-030, SC-006).

**Checkpoint**: as quatro rotas existem, se explicam sozinhas, entram no
sitemap/llms/robots, e o teste guarda preço, hora e número de voo. Entregável
por si só — a capa ainda não mudou.

---

## Phase 4: User Story 2 — O painel de partidas na capa (Prioridade: P2)

**Objetivo**: quem chega na capa vê o painel inteiro — quatro produtos, quatro
destinos virando em cascata — e escolhe a linha dele. O widget `.destino` ao
lado do H1 morre; a coluna passa a viver **dentro** de cada linha.

**Teste independente**: abrir `/` nas três larguras. Painel completo e parado no
primeiro quadro (moldura, quatro linhas, um destino legível por linha); as pás
começam a virar em cascata só depois de 160ms; nenhuma linha cresce com o
conteúdo; dois minutos ocioso sem repetir combinação.

**Depende de**: US1 — as quatro linhas passam a apontar para rota interna, e
apontar para 404 seria o Princípio IV quebrado na primeira tela.

- [ ] **T037** [US2] `src/components/Linha.astro` — a linha da placa com a
      coluna de destino dentro: código, nome, abrangência, coluna e estado, em
      célula de altura fixa (FR-012). Reusa a coluna de T009 e recebe
      `--linha` para a cascata.
- [ ] **T038** [US2] Em `src/pages/index.astro`, **remover o bloco `.destino`
      inteiro** — markup, o texto equivalente de leitor de tela do widget e a
      ligação temporária de T006 — e passar as quatro linhas a usar
      `Linha.astro`. Remover também as regras `.destino*` órfãs de
      `global.css`.
- [ ] **T039** [US2] A cascata: `animation-delay: calc(var(--linha) * -120ms)`,
      negativa (nasce adiantada em vez de esperar), com cada coluna montando a
      tabela `ciclo-N` do seu comprimento (FR-006 ·
      `contracts/coreografia.md` §2). Custo: 0 byte.
- [ ] **T040** [US2] **Mudança de contrato da linha** (`contracts/rotas.md` §3):
      `href` passa de `EXTERNOS.busca` para `produto.rota`; `target="_blank"` e
      `rel="noopener"` **saem**; o texto oculto deixa de dizer "abre em nova
      aba" e passa a nomear o portão. Anunciar aba nova num link que não abre é
      o Princípio IV aplicado a leitor de tela.
- [ ] **T041** [US2] Painel como objeto parafusado na parede: moldura visível em
      toda a volta, `--fundo` respirando fora dela nas três larguras, sem
      encostar nas quatro bordas do viewport (FR-009). Exatamente quatro linhas
      — nenhuma decorativa (FR-008). Respiro mínimo declarado em token, não em
      adjetivo: "respirando" sem número é a única regra geométrica sem medida
      nesta spec (ver A1 do `/speckit-analyze`).
      **Mesma regra de T026**: par de cor novo passa por `npm run contraste`
      antes de entrar no CSS, com o valor medido em comentário ao lado.
- [ ] **T042** [US2] Primeira tela sem `100vh`: unidade dinâmica com fallback, e
      a quarta linha visível ou meio-visível em 360×640 (FR-011). O H1 continua
      dono do LCP e **não anima** opacidade, escala nem posição (FR-010 · M6).
- [ ] **T043** [US2] Abaixo de 46rem, cada linha vira duas fileiras (código +
      nome / destino + estado) mantendo célula de altura fixa, fresta e moldura
      (FR-013). A coluna de estado continua em `24h` → `Abrir` no ponteiro,
      desligada em `(hover: none)` (FR-014 · G27).
- [ ] **T044** [US2] Medir as quatro colunas nas três larguras (1440, 46rem,
      360px) com o pior caso `CENTRO-OESTE` (12 caracteres) e com
      "Passagens aéreas" em mono 16px. A janela da coluna dentro da linha é
      **menor** que os 18ch do widget de hoje — ela divide o espaço com código,
      nome, abrangência e estado. Nenhum rótulo pode quebrar em duas linhas
      (SC-010); a mono já quebrou duas vezes por 1px, e está no log.
- [ ] **T045** [US2] Bloco `prefers-reduced-motion: reduce` do painel completo,
      no mesmo commit (FR-036): quatro linhas inteiras e imóveis, um destino
      visível por linha, vinco e moldura no lugar. Nenhuma informação exclusiva
      do movimento.
- [ ] **T046** [US2] `npm test` verde (V1–V8) e `npm run verificar` na capa:
      CLS ≤ 0,01, console limpo, zero estouro horizontal, quadro de
      reduced-motion e quadro de hover (`24h` → `Abrir`).

**Checkpoint**: capa e portões funcionam, cada um por si. Falta a costura.

---

## Phase 5: User Story 3 — A transição capa → portão (Prioridade: P3)

**Objetivo**: a célula que a pessoa ativou vira o objeto da cabeça do portão, e
a navegação inteira lê como uma peça só mudando de valor. É a única entrega que
exige as duas pontas juntas.

**Teste independente**: ativar cada linha (clique, toque e Enter com foco) e ver
a célula virar no objeto do portão, sem a página piscar em branco. Depois: o
mesmo caminho em navegador **sem** View Transitions — navegação normal, sem
transição, sem erro no console, sem perda de conteúdo.

- [ ] **T047** [US3] `view-transition-name: vt-<codigo>` (`vt-aer`, `vt-htl`,
      `vt-pct`, `vt-car`) na coluna de destino de cada linha da capa e no objeto
      da cabeça do portão correspondente. O nome precisa existir nos **dois**
      documentos e ser único dentro de cada um — por isso é por código de
      produto e não um nome genérico (FR-025).
- [ ] **T048** [US3] Confirmar que `view-transition-name: faixa` continua e que
      o nome novo **se soma** a ele, não substitui (FR-026): a faixa atravessa,
      o objeto vira — duas partes do mesmo gesto.
- [ ] **T049** [US3] Sem `ClientRouter` do Astro. A transição é
      `@view-transition { navigation: auto }` declarativo, cross-document —
      o roteador custaria ~7 kb de JS e foi recusado por escrito em
      `research.md` §R5. Confirmar 0 byte servido depois desta tarefa.
- [ ] **T050** [US3] Degradação: navegador sem View Transitions navega normal,
      sem erro no console e sem perda de conteúdo (FR-027); em
      `prefers-reduced-motion: reduce` toda transição de rota é desligada e a
      navegação continua (FR-028).
- [ ] **T051** [US3] Em `logos/verificar.mjs`, o quadro da transição
      capa→portão (SC-009) e o quadro do caminho de degradação limpa.

**Checkpoint**: as quatro camadas da coreografia de pé, 0 byte de JavaScript.

---

## Phase 6: Polish e verificação final

**Propósito**: os números que a spec cobra, medidos contra o **build servido** —
nunca contra o `astro dev`, que injeta ~1,8 MB de JS que não existe em produção.

- [ ] **T052** [P] **Conferência final, não a primeira medição.** Os pares das
      superfícies novas — cabeça de portão, fresta de duas colunas do PCT, grade
      IATA do CAR, e o anel de foco sobre cada uma delas — já entraram em
      `logos/contraste.mjs` em T026 e T041, quando o CSS foi escrito
      (Princípio V: *antes*, não depois). Aqui se confere o total: **≥ 45 pares,
      0 reprovados** (SC-001, FR-034), e que nenhum par tenha entrado no CSS sem
      o valor medido em comentário ao lado. O script continua **lendo
      `tokens.css`** — nenhuma cópia da paleta em hex entra nele.
- [ ] **T053** [P] Em `logos/verificar.mjs`, iterar **9 rotas × 3 larguras × 4
      posições de rolagem** (correção 3 do `plan.md`: SC-002 diz 5, que é a
      contagem de antes desta feature), mais os quadros especiais: um
      reduced-motion por rota, hover no painel, 360px por portão.
- [ ] **T054** Orçamento na constante `ORCAMENTO` de `logos/verificar.mjs`,
      falhando com código 1 se estourar: LCP mediano ≤ 800ms por rota (5
      amostras, CPU 4× estrangulada), CLS ≤ 0,01 nas nove rotas, **0 byte de
      JS** em `.vercel/output/static` (SC-003, SC-004, SC-005).
- [ ] **T055** Passagem de teclado completa nas nove rotas: 0 paradas sem anel
      de foco visível, contraste do anel ≥ 3:1 contra a superfície onde aparece
      (SC-007, FR-035).
- [ ] **T056** Leitor de tela na capa: cada linha anunciada como link com
      produto e abrangência (sem o aviso de nova aba, que migrou para o bloco 5
      dos portões), e a coluna que vira **não** lida como texto mudando no meio
      da leitura (FR-037, Cenário 8).
- [ ] **T057** **Olhar 1** — painel ocioso por dois minutos (SC-012): as quatro
      colunas não podem mostrar a mesma combinação duas vezes. A conta diz que a
      repetição só volta em 1h52; os dois minutos pegam o caso em que a conta
      está certa e o CSS não.
- [ ] **T058** **Olhar 2** — os quatro portões lado a lado (FR-020). Se dois se
      parecem, a spec reprova, por melhor que cada um esteja sozinho. O teste
      pega valor repetido; ele **não** pega quatro desenhos diferentes que leem
      igual.
- [ ] **T059** **Olhar 3** — a pá no meio da queda: os quadros congelados pela
      Web Animations API provam que a luz corre atrás do ângulo, em vez de a
      peça aterrissar já acesa. É a diferença entre uma superfície e um texto
      girando, e não aparece em quadro parado.
- [ ] **T060** Reconferir a não-colisão com o hub (T002) **antes do merge** e
      registrar o resultado (FR-041).
- [ ] **T061** Entrada nova em `.art/log.json` (SC-013): o que foi construído, o
      que foi construído **e removido**, e as correções encontradas *olhando a
      tela* — não só as previstas. A entrega anterior corrigiu um defeito de
      superfície chapada que nenhum gate pegou; quem pegou foi olhar.

---

## Portão de conformidade obrigatório

`/speckit-analyze` **antes** de `/speckit-implement`. A governança exige em
features que toquem conteúdo de preço, registro ou marca de terceiro — esta toca
os três (FR-029, FR-031, FR-021). **Não é opcional aqui** (`plan.md`).

---

## Dependências e ordem de execução

### Entre fases

- **Setup (1)**: sem dependência.
- **Foundational (2)**: depende de Setup. **BLOQUEIA as três histórias.**
- **US1 (3)**: depois da Foundational. Entregável sozinha.
- **US2 (4)**: depois da **US1** — as linhas viram links internos, e link
  interno para rota inexistente é o Princípio IV quebrado na primeira tela.
- **US3 (5)**: depois de US1 **e** US2 — precisa das duas pontas.
- **Polish (6)**: depois das três histórias.

### Dentro da Foundational

**Uma cadeia só, e ela começa no teste** — a ordem antiga tinha três cadeias
paralelas que se contradiziam: os keyframes (T008–T010) vinham antes dos testes
que os guardam, o oposto da etapa 2 do `plan.md` e do que o próprio T018 manda
fazer.

```
T011                        a leitura do teste, antes de o dado sumir debaixo dela
  → T012–T017               V1, V2, V3, V4, V5, V7 escritos para falhar
  → T018 (1ª passagem)      vermelho: V1, V3, V4, V5
  → T003 → T004 → T005      o dado: tipos, os quatro campos, as quatro listas,
                            DESTINOS apagado  ·  V1, V4, V5 ficam verdes
  → T018 (2ª passagem)      V3 e V2 ainda vermelhos — é o ponto
  → T007 → T008             tokens e as quatro tabelas  ·  V3 e V2 ficam verdes
  → T009 → T010             a coluna reusável e o bloco reduced-motion
  → T006                    a ligação temporária do widget (precisa de ciclo-11)
  → T019                    npm run check limpo
```

T011 antes de T005 não é preciosismo de TDD: hoje o teste lê `DESTINOS` num
`assert` de topo de módulo, então apagar a constante primeiro faz a suíte
estourar na importação — e uma suíte que não carrega não mostra vermelho
nenhum. T006 por último porque `ciclo-11` nasce em T008.

### Dentro de US1

T020–T023 são `[P]` (mesmo arquivo, seções diferentes — coordenar o commit).
T024 independente. T025–T029 antes de T030–T033.
**T030 → T031 → T032 → T033 em série**, um portão por vez até o fim.
T034 → T035 → T036 por último.

### Dentro de US2

T037 → T038 → T039 → T040 → T041–T043 → T044 (medição) → T045 → T046.

### Oportunidades de paralelo

- T020, T021, T022, T023 — conteúdo dos portões, seções diferentes.
- T052 e T053 — ferramentas diferentes, arquivos diferentes.
- T012, T014, T015, T016, T017 podem ser escritos em paralelo, desde que T011
  (a leitura do dado novo) já esteja de pé.
- **Nada mais.** Os quatro portões em paralelo é exatamente como se produz
  quatro páginas clonadas.

---

## Estratégia de entrega

### MVP (só US1)

Setup → Foundational → US1 → **parar e validar**: quatro portões abertos direto,
`npm test` verde, sitemap 8, `npm run verificar` nas oito rotas + `/404`.
Publicável: a capa continua funcionando como hoje.

### Incremental

1. Setup + Foundational → base pronta
2. + US1 → quatro portões (MVP, publicável)
3. + US2 → o painel de partidas (publicável)
4. + US3 → a costura entre os dois
5. + Polish → os números medidos e os três olhares

---

## Notas

- `[P]` = arquivo diferente, sem dependência.
- Cada história é completável e testável sozinha, na ordem dada.
- **Ver o teste falhar antes de escrever o CSS** (T018) não é formalidade: é a
  única prova de que a fórmula está no teste.
- Commit por tarefa ou por grupo lógico; `prefers-reduced-motion` **no mesmo
  commit** que a animação, sempre (FR-036).
- Passar nos comandos não é estar certo. Os três olhares (T057–T059) são a
  parte que ferramenta nenhuma faz.
