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

- [X] **T001** Rodar a sequência inteira do `quickstart.md` no estado atual
      (`npm test`, `npm run check`, `npm run contraste`, `npm run build`,
      `npm run verificar`) e anotar os números de partida: pares de contraste
      medidos (hoje 37), URLs no sitemap (hoje 4), rotas verificadas (hoje **1** —
      `verificar.mjs` visita a capa e só ela; ver T053),
      LCP e CLS por rota. É contra estes números que SC-001, SC-011 e SC-002 vão
      ser lidos no fim — sem a linha de base, "subiu de 37 para ≥45" não é
      verificável.
- [X] **T002** Confirmar no `astro.config.mjs` do **hub** que `/viagens/*` não
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

- [X] **T003** Em `src/data/conteudo.ts`, declarar o tipo `Produto`
      (`data-model.md` §1) com os quatro campos novos — `rota`, `destinos`,
      `objeto`, `detalhe` — e aplicá-lo a `PRODUTOS`. `objeto` e `detalhe` são
      uniões literais fechadas; o tipo é o que faz `npm run check` pegar um
      quinto valor inventado.
- [X] **T004** Em `src/data/conteudo.ts`, preencher os quatro produtos com
      `rota` (`/passagens-aereas`, `/hoteis`, `/pacotes`, `/aluguel-de-carro`),
      `objeto` (`par` / `faixa` / `duasMetades` / `campoUnico`) e `detalhe`
      (`comparacao` / `estados` / `duasColunas` / `grade`), conforme a tabela de
      instâncias do `data-model.md` §1.
- [X] **T005** Em `src/data/conteudo.ts`, escrever as quatro listas
      `destinos` (11 / 8 / 7 / 5 nomes, `data-model.md` §2) e **apagar
      `export const DESTINOS`**. Só país e região, caixa alta, ≤ 12 caracteres,
      nenhuma cidade — a regra vem de R2 e do Princípio VI, não de gosto.
- [X] **T006** Em `src/pages/index.astro`, apontar o widget `.destino` que ainda
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

- [X] **T007** Em `src/styles/tokens.css`, remover `--pa-total` (era
      `--pa-parada × 8`, e não existe mais um único N) e acrescentar
      `--pa-cascata: 120ms` (FR-006). `--pa-parada: 2.2s` e `--pa-giro: 0.176s`
      ficam como estão — a velocidade do giro é a mesma nas quatro colunas
      (cláusula da velocidade única, `contracts/coreografia.md` §2).
- [X] **T008** Em `src/styles/global.css`, substituir `@keyframes ciclo` pelas
      **quatro** tabelas `ciclo-5`, `ciclo-7`, `ciclo-8` e `ciclo-11`, com as
      porcentagens da tabela de `contracts/coreografia.md` §2. Em cada uma, a
      saída **vaza além** do slot da pá e se sobrepõe à entrada da seguinte —
      contida no slot, a janela pisca em branco a cada troca. Escrever a
      fórmula (`giro% = 8/N`) em comentário ao lado.
- [X] **T009** Em `src/styles/global.css`, generalizar a coluna que vira
      (`.destino__janela` / `.destino__pa`) numa classe reusável de coluna de
      destino, com altura de célula fixa reservada antes de qualquer animação
      (FR-012, M7) e `aria-hidden` no elemento que vira mais o equivalente em
      texto para leitor de tela (FR-037). Ela é usada 8× depois: 4 linhas do
      painel e 4 cabeças de portão.
- [X] **T010** Em `src/styles/global.css`, escrever o bloco
      `prefers-reduced-motion: reduce` da coluna nova **no mesmo commit** que a
      animação (FR-036): um destino visível por coluna, parado, vinco e moldura
      no lugar. Nenhum `filter`/`backdrop-filter` dentro de keyframe (FR-038).

### Os testes, antes do CSS que eles guardam

> Escritos para **falhar** contra o estado atual. Esta é a única ordem que
> garante que a fórmula das tabelas está no teste, e não só na cabeça de quem
> escreveu o CSS (etapa 2 do `plan.md`).

- [X] **T011** **Primeira tarefa da fase** (ver "Dentro da Foundational"). Em
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
- [X] **T012** **V1** — teste em `test/placa.test.mjs`: `objeto` e `detalhe` têm
      quatro valores **distintos** entre os quatro produtos (FR-020). Valor
      repetido = dois portões com o mesmo desenho, e isso reprova a spec
      inteira.
- [X] **T013** **V3** — teste em `test/placa.test.mjs`: recalcular as quatro
      tabelas de keyframe pela fórmula, a partir de `--pa-parada` e `--pa-giro`
      lidos de `tokens.css` e dos comprimentos **reais** das quatro listas, e
      comparar com o que está em `global.css`. É a tarefa que carrega o maior
      risco técnico da feature (`plan.md`, tabela de riscos).
- [X] **T014** **V2** — estender o teste da sobreposição para as quatro tabelas:
      em cada `ciclo-N`, a saída termina **depois** de `100/N %`. O teste falha
      se alguém "consertar" a sobreposição.
- [X] **T015** **V4** — teste: os quatro comprimentos são coprimos dois a dois e
      `mmc × --pa-parada ≥ 3600s` (FR-005). Com 5/7/8/11 dá 1h52min56s.
- [X] **T016** **V5** — teste: todo destino tem ≤ 12 caracteres, está em caixa
      alta, sem pontuação além de hífen, e não é nome de cidade (lista fechada
      de exceções vazia). Nenhum nome repetido **dentro** da mesma lista.
- [X] **T017** **V7** — estender o teste de CTA: todo link externo aponta para
      `EXTERNOS.busca`, e nenhuma página escreve `onertravel` à mão. Reprovar
      explicitamente `flight-list`, `hotel-list`, `car-list` e `combined` —
      são as URLs que dizem "nenhum voo foi encontrado" a quem não buscou
      (R1 · Princípio IV).
- [X] **T018** Rodar `npm test` **duas vezes**, e ver o vermelho antes do
      verde. Primeira, logo depois de T012–T017 e **antes de T003–T010**: V1,
      V3, V4 e V5 falham — nem o dado nem as tabelas existem. Segunda, depois de
      T003–T005: V1, V4 e V5 ficam verdes e **V3 e V2 continuam vermelhos** até
      T007–T008 entregarem as quatro tabelas. Sem as duas passagens o teste não
      prova nada — prova só que foi escrito depois.
- [X] **T019** `npm run check` limpo (0 erros) com `DESTINOS` já removido.

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

- [X] **T020** [P] [US1] Em `src/data/conteudo.ts`, `COBERTURA[codigo]:
      string[]` — a lista densa do bloco 2 dos quatro portões. Zero card, zero
      ícone de linha (FR-016 §2).
- [X] **T021** [P] [US1] Em `src/data/conteudo.ts`, `FICHA[codigo]:
      {rotulo, valor, fonte?}[]` — a tabela de fatos do bloco 4: abrangência,
      formas de pagamento, prazo de emissão, quem emite, quem opera o site.
      **Toda alegação verificável carrega `fonte`** (FR-031 · Princípio VI); o
      padrão é o que o FAQ já usa com `EXTERNOS.susepConsulta`.
- [X] **T022** [P] [US1] Em `src/data/conteudo.ts`, os dados do bloco 3, um por
      portão, cada um com forma própria (`data-model.md` §4.1): AER `string[]`
      de companhias; HTL `{regime, oQueInclui}[]`; PCT
      `{entra: string[], naoEntra: string[]}`; CAR `{iata, cidade}[]`. Nome de
      terceiro em **tipografia, nunca logotipo** (FR-021).
- [X] **T023** [P] [US1] Em `src/data/conteudo.ts`, `titulo`, `descricao` e
      `bluf` próprios por portão (`data-model.md` §4.2). Nenhum herda o
      `<title>` da capa; a `descricao` vende o clique e o `bluf` responde a
      pergunta — são textos diferentes, de propósito.
- [X] **T024** [US1] Em `src/consts.ts`, acrescentar ao comentário de
      `EXTERNOS.busca` a razão **medida** de ela continuar sendo uma URL só (R1:
      a plataforma não aceita link profundo utilizável). Nenhum valor muda.

### Esqueleto das quatro rotas

- [X] **T025** [US1] Em `src/layouts/Base.astro`, acrescentar ao `@graph` o nó
      `Service` por portão, conforme `contracts/dados-estruturados.md` §2:
      `@id` único com `#servico`, `provider` como **referência** ao
      `/#agencia` existente, `description` = o BLUF palavra por palavra. Nenhum
      `offers`, `price`, `priceRange` ou `priceSpecification` — em texto ou em
      schema (S4).
- [X] **T026** [US1] Em `src/styles/global.css`, a macroestrutura `.portao`:
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
- [X] **T027** [US1] `src/components/CabecaDePortao.astro` — bloco 1: o código
      do produto em escala de objeto, como pá que acabou de travar, com a coluna
      de destino daquele produto virando. A forma varia por `produto.objeto`
      (quatro valores, quatro desenhos). Reusa a coluna de T009.
- [X] **T028** [US1] A linha de placa de volta ao painel (`href="/"`), na mesma
      posição nos quatro portões — **não** breadcrumb, **não** botão "voltar"
      (FR-019). Faixa de estado e rodapé de uma linha mantidos (FR-018).
- [X] **T029** [US1] Bloco 5 ("Ação") comum aos quatro: a tecla apontando para
      `EXTERNOS.busca` em nova aba (`target="_blank" rel="noopener"`), com a
      advertência de aba nova e de mudança de ambiente visual (FR-023). O texto
      **não promete filtro**: diz que a aba de produto se escolhe do outro lado
      (correção 1 do `plan.md`). Nada de "emenda visual" em degradê — já foi
      construída e removida uma vez; quem faz esse trabalho é a frase.

### Os quatro portões, um por vez, cada um até o fim

> Construir os quatro blocos 1 e depois os quatro blocos 2 é o caminho mais
> curto para quatro páginas clonadas — que reprovam a spec inteira por FR-020
> (etapa 5 do `plan.md`). Estas quatro tarefas **não** são `[P]`.

- [X] **T030** [US1] `src/pages/passagens-aereas.astro` completo, os cinco
      blocos: cabeça com **par de pás** (ida ‖ volta), cobertura, bloco 3
      `comparacao` (companhias lado a lado, tipografia), ficha, ação.
- [X] **T031** [US1] `src/pages/hoteis.astro` completo: cabeça com **pá única
      sobre faixa de noites**, cobertura, bloco 3 `estados` (regimes como quatro
      estados da mesma pá), ficha, ação.
- [X] **T032** [US1] `src/pages/pacotes.astro` completo: cabeça com **pá de duas
      metades** — voo em cima, hotel embaixo, o vinco é a emenda —, cobertura,
      bloco 3 `duasColunas` (entra ‖ não entra, em fresta), ficha, ação. É a
      peça em que a direção se prova (FR-022): a matéria carrega o argumento, o
      texto não repete o que a peça já diz.
- [X] **T033** [US1] `src/pages/aluguel-de-carro.astro` completo: cabeça com
      **campo único** (retirada e devolução no mesmo campo), cobertura, bloco 3
      `grade` (aeroportos de retirada em códigos IATA), ficha, ação.

### Publicação das rotas

- [X] **T034** [US1] `src/pages/llms.txt.ts` e `src/pages/robots.txt.ts`: as
      quatro rotas novas nas duas listas (FR-041). No `llms.txt`, a declaração
      em maiúsculas sobre ausência de preço passa a valer explicitamente para as
      nove rotas, e continua declarado que o número de Cadastur **não** está
      publicado.
- [X] **T035** [US1] **V8** — teste em `test/placa.test.mjs`: quatro rotas,
      quatro slugs únicos, sem colisão; e `npm run build` produzindo
      **8 URLs no sitemap** (`dist/sitemap-0.xml`), com `/404` fora dele.
      Corrige o "9" de SC-011 (correção 2 do `plan.md`).
- [X] **T036** [US1] **V6** — estender o teste de conteúdo servido para ler o
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

- [X] **T037** [US2] `src/components/Linha.astro` — a linha da placa com a
      coluna de destino dentro: código, nome, abrangência, coluna e estado, em
      célula de altura fixa (FR-012). Reusa a coluna de T009 e recebe
      `--linha` para a cascata.
- [X] **T038** [US2] Em `src/pages/index.astro`, **remover o bloco `.destino`
      inteiro** — markup, o texto equivalente de leitor de tela do widget e a
      ligação temporária de T006 — e passar as quatro linhas a usar
      `Linha.astro`. Remover também as regras `.destino*` órfãs de
      `global.css`.
- [X] **T039** [US2] A cascata: `animation-delay: calc(var(--linha) * -120ms)`,
      negativa (nasce adiantada em vez de esperar), com cada coluna montando a
      tabela `ciclo-N` do seu comprimento (FR-006 ·
      `contracts/coreografia.md` §2). Custo: 0 byte.
- [X] **T040** [US2] **Mudança de contrato da linha** (`contracts/rotas.md` §3):
      `href` passa de `EXTERNOS.busca` para `produto.rota`; `target="_blank"` e
      `rel="noopener"` **saem**; o texto oculto deixa de dizer "abre em nova
      aba" e passa a nomear o portão. Anunciar aba nova num link que não abre é
      o Princípio IV aplicado a leitor de tela.
- [X] **T041** [US2] Painel como objeto parafusado na parede: moldura visível em
      toda a volta, `--fundo` respirando fora dela nas três larguras, sem
      encostar nas quatro bordas do viewport (FR-009). Exatamente quatro linhas
      — nenhuma decorativa (FR-008). Respiro mínimo declarado em token, não em
      adjetivo: "respirando" sem número é a única regra geométrica sem medida
      nesta spec (ver A1 do `/speckit-analyze`).
      **Mesma regra de T026**: par de cor novo passa por `npm run contraste`
      antes de entrar no CSS, com o valor medido em comentário ao lado.
- [X] **T042** [US2] Primeira tela sem `100vh`: unidade dinâmica com fallback, e
      a quarta linha visível ou meio-visível em 360×640 (FR-011). O H1 continua
      dono do LCP e **não anima** opacidade, escala nem posição (FR-010 · M6).
- [X] **T043** [US2] Abaixo de 46rem, cada linha vira duas fileiras (código +
      nome / destino + estado) mantendo célula de altura fixa, fresta e moldura
      (FR-013). A coluna de estado continua em `24h` → `Abrir` no ponteiro,
      desligada em `(hover: none)` (FR-014 · G27).
- [X] **T044** [US2] Medir as quatro colunas nas três larguras (1440, 46rem,
      360px) com o pior caso `CENTRO-OESTE` (12 caracteres) e com
      "Passagens aéreas" em mono 16px. A janela da coluna dentro da linha é
      **menor** que os 18ch do widget de hoje — ela divide o espaço com código,
      nome, abrangência e estado. Nenhum rótulo pode quebrar em duas linhas
      (SC-010); a mono já quebrou duas vezes por 1px, e está no log.
- [X] **T045** [US2] Bloco `prefers-reduced-motion: reduce` do painel completo,
      no mesmo commit (FR-036): quatro linhas inteiras e imóveis, um destino
      visível por linha, vinco e moldura no lugar. Nenhuma informação exclusiva
      do movimento.
- [X] **T046** [US2] `npm test` verde (V1–V8) e `npm run verificar` na capa:
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

- [X] **T047** [US3] `view-transition-name: vt-<codigo>` (`vt-aer`, `vt-htl`,
      `vt-pct`, `vt-car`) na coluna de destino de cada linha da capa e no objeto
      da cabeça do portão correspondente. O nome precisa existir nos **dois**
      documentos e ser único dentro de cada um — por isso é por código de
      produto e não um nome genérico (FR-025). Sem hífen duplo: é `vt-aer`, não
      `--vt-aer` (A2 — `research.md` §R5 corrigido para casar com o contrato).
- [X] **T047a** [US3] **Os três sem par** (G4, decidido em 2026-08-28 — ver
      `contracts/coreografia.md` §3, "Cláusula dos três sem par"). A capa tem
      quatro nomes e o portão tem um; os outros três recebem o
      `-ua-view-transition-fade-out` do navegador e ficam **parados, retos e
      nítidos** sobre a página de destino depois que o `corpo` já saiu (medido:
      op 0,14 e `transform: none` em t=140ms, contra op 0,02 do `corpo`). Isso é
      fade puro, proibido, e é consequência de `main { view-transition-name:
      corpo }` — nome próprio retira o elemento do snapshot do ancestral.
      Escrever, dentro do bloco `no-preference` já existente em
      `global.css:242`:

      ```css
      ::view-transition-old(vt-aer), ::view-transition-old(vt-htl),
      ::view-transition-old(vt-pct), ::view-transition-old(vt-car) {
        animation: pa-sai var(--dur-base) var(--ease-pa) both;
      }
      ::view-transition-new(vt-aer), ::view-transition-new(vt-htl),
      ::view-transition-new(vt-pct), ::view-transition-new(vt-car) {
        animation: pa-entra var(--dur-pa) var(--ease-pa) both;
      }
      ```

      Os quatro nomes, não três: não existe seletor que distinga o par do órfão,
      e a regra certa para os três é a mesma do quarto. 0 byte enviado ao
      cliente. **Não** tentar nomear só a linha ativada: não existe sem JS
      (`@view-transition { types }` é estático por documento, `:target` não tem
      fragmento, `:focus-visible` não dispara em clique de ponteiro).
- [X] **T047b** [US3] **Desligar a transição sob movimento reduzido** (G4,
      achado colateral). FR-028 contrata "transição de rota desligada" e hoje o
      CSS não entrega: as regras de `::view-transition-*(corpo)` moram dentro de
      `@media (prefers-reduced-motion: no-preference)`, então sob `reduce` sobra
      o **cross-fade padrão do navegador** nos cinco nomes, com os grupos ainda
      transladando — o caminho de acessibilidade é hoje a versão mais cheia de
      fade da página. Acrescentar ao bloco `reduce` de `global.css:267`:

      ```css
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation: none !important;
      }
      ```

      Medido depois da regra: zero animação de pseudo-elemento, página de
      destino inteira no primeiro quadro.
- [X] **T048** [US3] Confirmar que `view-transition-name: faixa` continua e que
      o nome novo **se soma** a ele, não substitui (FR-026): a faixa atravessa,
      o objeto vira — duas partes do mesmo gesto.
- [X] **T049** [US3] Sem `ClientRouter` do Astro. A transição é
      `@view-transition { navigation: auto }` declarativo, cross-document —
      o roteador custaria ~7 kb de JS e foi recusado por escrito em
      `research.md` §R5. Confirmar 0 byte servido depois desta tarefa.
- [X] **T050** [US3] Degradação: navegador sem View Transitions navega normal,
      sem erro no console e sem perda de conteúdo (FR-027); em
      `prefers-reduced-motion: reduce` toda transição de rota é desligada e a
      navegação continua (FR-028). O desligamento sob `reduce` **não é
      automático** — é a regra de T047b; sem ela o navegador aplica o cross-fade
      padrão e FR-028 fica por escrito e não no CSS. O engine da prova é o
      Firefox, e o porquê está em T051.
- [X] **T051** [US3] Em `logos/verificar.mjs`, o quadro da transição capa→portão
      **e a prova da degradação** (SC-009). Os dois têm método fixado, porque
      critério medível sem método de medição é caixa marcada no olho.

      **O quadro da transição** (chromium, o engine que suporta): congelar pela
      Web Animations API, como o quadro da queda da pá já faz. O gancho é
      `pagereveal` no documento **novo** — é o único ponto que roda antes de a
      transição começar. Dentro dele, `e.viewTransition.ready.then(…)`, pausar
      toda animação cujo `effect.pseudoElement` comece com `::view-transition` e
      pôr `currentTime` no instante desejado. Dois quadros bastam: **60ms**
      (o corpo virando) e **140ms** (o corpo praticamente fora — é onde um órfão
      parado aparece). Falhar se qualquer `::view-transition-old(vt-*)` estiver
      rodando `-ua-view-transition-fade-out`: esse nome de animação **é** o bug
      do G4 voltando. Um contexto novo por quadro — o documento congelado fica
      com uma transição ativa que nunca termina, e navegar para fora dele faz o
      Chromium pular a transição seguinte.

      **A prova da degradação**: importar `firefox` de `playwright` (o engine já
      está no cache local, `firefox-1497`) e rodar **só a passagem capa → um
      portão** nele. Confirmado em 2026-08-28, Firefox 144: nenhum `pagereveal`,
      nenhum `pageswap`, navegação normal, console limpo, conteúdo inteiro do
      outro lado. **A pegadinha**: o Firefox suporta `view-transition-name` e
      `document.startViewTransition` (transição *same-document*) — um teste de
      suporte por `CSS.supports` dá falso positivo ali. O que separa os engines
      é `"onpagereveal" in window`, e é isso que a asserção lê. WebKit 26 **faz**
      VT cross-document e por isso não serve de prova; se um dia o Firefox
      passar a fazer, o engine da prova muda — a asserção `onpagereveal === false`
      quebra sozinha e avisa. Assertivas: `onpagereveal` ausente, zero evento de
      transição, console limpo, e o `h1` + o objeto da cabeça do portão
      presentes no destino.

**Checkpoint**: as quatro camadas da coreografia de pé, 0 byte de JavaScript.

---

## Phase 6: Polish e verificação final

**Propósito**: os números que a spec cobra, medidos contra o **build servido** —
nunca contra o `astro dev`, que injeta ~1,8 MB de JS que não existe em produção.

- [X] **T052** [P] **Conferência final, não a primeira medição.** Os pares das
      superfícies novas — cabeça de portão, fresta de duas colunas do PCT, grade
      IATA do CAR, e o anel de foco sobre cada uma delas — já entraram em
      `logos/contraste.mjs` em T026 e T041, quando o CSS foi escrito
      (Princípio V: *antes*, não depois). Aqui se confere o total: **≥ 45 pares,
      0 reprovados** (SC-001, FR-034), e que nenhum par tenha entrado no CSS sem
      o valor medido em comentário ao lado. O script continua **lendo
      `tokens.css`** — nenhuma cópia da paleta em hex entra nele.
- [X] **T053** [P] **Criar o laço de rota em `logos/verificar.mjs`. Não é
      parametrizar um laço — é criar um.** A linha de base é **1**, não 5: hoje
      o script visita a capa e só ela (`:77`, `pagina.goto(base, …)`, sem laço de
      rota), e os quatro quadros especiais (`:101` hover, `:135` queda da pá,
      `:180` reduced-motion, `:200` teclado) estão todos amarrados à capa em
      1440×900. O `5` da redação original de SC-002 nunca correspondeu a nada
      medido. Chegar a **9 rotas × 3 larguras × 4 posições de rolagem** (SC-002).
      As quatro decisões que a tarefa toma:

      1. **Quais especiais valem por rota.** `reduced-motion` é **por rota**
         (SC-008 é por rota — cada portão tem que sobreviver parado). `hover` e
         `queda da pá` só onde existe coluna girando: **capa + as quatro cabeças
         de portão**, 5 rotas, não 9. `teclado` é por rota (T055 já pede as
         nove). O quadro da transição e o da degradação são de T051 e não
         entram neste laço.
      2. **Nome do arquivo.** Hoje é `{largura}-{pct}.png` e com 9 rotas colide.
         Passa a `{rota}-{largura}-{pct}.png`, com `rota` = o slug (`capa` para
         `/`, `404` para `/404`). Os especiais viram `{rota}-{largura}-{quadro}`
         (`capa-1440-hover`, `hoteis-1440-reduzido`).
      3. **`ORCAMENTO` passa a ser por rota.** SC-003 diz "LCP mediano ≤ 800ms
         **por rota**" e um número global não prova isso — a capa pode segurar a
         mediana de um portão lento. Ver T054.
      4. **Vai ficar lento, e a saída não é cortar cobertura.** O `plan.md` já
         decidiu: *"é custo de ferramenta, não de página; se incomodar, a saída é
         paralelizar, **não** reduzir a cobertura."* Paralelizar por rota, com um
         `newContext` por trabalhador e um teto pequeno (4) para não estrangular
         a própria máquina que está medindo LCP — **medida sob contenção não é
         medida**, então o bloco de LCP/CLS de `:226` roda serial mesmo com o
         resto paralelo.

      Dois ajustes que cabem na mesma passada, porque são o mesmo laço:

      - **I6** — FR-011 e T042 nomeiam **360×640** como o caso a provar (quarta
        linha visível ou meio-visível); o laço mede 360×**780**. Os 140px de
        diferença são exatamente onde a quarta linha some. A largura 360 passa a
        ter **duas alturas**, 640 e 780, ou o FR muda de número — 640 é o que
        está contratado, então é o laço que se ajusta.
      - **I8** — o breakpoint de FR-013 é `46rem` = **736px** e o laço mede 768.
        A faixa 736–767 (o lado largo logo acima da virada) nunca é fotografada.
        Acrescentar **736** à lista de larguras.
- [X] **T054** Orçamento na constante `ORCAMENTO` de `logos/verificar.mjs`,
      falhando com código 1 se estourar: LCP mediano ≤ 800ms **por rota** (5
      amostras por rota, CPU 4× estrangulada), CLS ≤ 0,01 nas nove rotas, **0
      byte de JS** em `.vercel/output/static` (SC-003, SC-004, SC-005). `ORCAMENTO`
      deixa de ser um número global (`:29`, hoje `{ lcp: 1500, cls: 0.05, js: 0 }`
      para uma página só) e passa a ser lido por rota, com o alvo declarado uma
      vez e a leitura registrada nove vezes. A mensagem de falha nomeia **qual
      rota** estourou — "LCP 940ms" sem a rota não diz onde mexer.
- [X] **T055** Passagem de teclado completa nas nove rotas: 0 paradas sem anel
      de foco visível, contraste do anel ≥ 3:1 contra a superfície onde aparece
      (SC-007, FR-035).
- [X] **T056** Leitor de tela na capa: cada linha anunciada como link com
      produto e abrangência (sem o aviso de nova aba, que migrou para o bloco 5
      dos portões), e a coluna que vira **não** lida como texto mudando no meio
      da leitura (FR-037, Cenário 8).
- [X] **T057** **Olhar 1** — painel ocioso por dois minutos (SC-012): as quatro
      colunas não podem mostrar a mesma combinação duas vezes. A conta diz que a
      repetição só volta em 1h52; os dois minutos pegam o caso em que a conta
      está certa e o CSS não.
- [X] **T058** **Olhar 2** — os quatro portões lado a lado (FR-020). Se dois se
      parecem, a spec reprova, por melhor que cada um esteja sozinho. O teste
      pega valor repetido; ele **não** pega quatro desenhos diferentes que leem
      igual.
- [X] **T059** **Olhar 3** — a pá no meio da queda: os quadros congelados pela
      Web Animations API provam que a luz corre atrás do ângulo, em vez de a
      peça aterrissar já acesa. É a diferença entre uma superfície e um texto
      girando, e não aparece em quadro parado.
- [X] **T060** Reconferir a não-colisão com o hub (T002) **antes do merge** e
      registrar o resultado (FR-041).
- [X] **T061** Entrada nova em `.art/log.json` (SC-013): o que foi construído, o
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
