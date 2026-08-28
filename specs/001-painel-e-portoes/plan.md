# Implementation Plan: o saguão — painel de partidas em escala de herói e quatro portões de embarque

**Branch**: `001-painel-e-portoes` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-painel-e-portoes/spec.md`

## Summary

O site é hoje **uma placa com uma pá**: cinco rotas, das quais uma vende alguma
coisa, e um widget giratório ao lado do H1. Esta feature o transforma num
**saguão** — a capa vira o painel de partidas em escala arquitetônica, com uma
coluna de destino virando em cada uma das quatro linhas, e cada linha passa a ter
uma página atrás dela.

Tecnicamente são três movimentos, nesta ordem:

1. **Dado antes de forma.** `DESTINOS` (8 cidades) morre e vira quatro listas
   por produto, de comprimentos coprimos (11 / 8 / 7 / 5), com nomes de país e
   região — decisão do dono, porque cidade é afirmação sobre inventário de
   terceiro. `PRODUTOS` ganha `rota`, `destinos`, `objeto` e `detalhe`.
2. **A aritmética.** Quatro comprimentos diferentes exigem **quatro tabelas de
   `@keyframes`**, porque seletor de keyframe não aceita `var()` e a velocidade
   do giro precisa ser a mesma nas quatro colunas. É o maior risco técnico da
   feature — é exatamente a classe de defeito que fez `test/placa.test.mjs`
   existir — e a mitigação é o teste recalcular as quatro tabelas pela fórmula.
3. **As quatro rotas.** Portões estáticos com macroestrutura própria (cinco
   blocos), diferente do Índice da capa e do `.doc` das fichas legais, com a
   regra de variação (FR-020) impedindo que virem template.

Custo: **0 byte de JavaScript, 0 dependência nova, 0 imagem nova**. A
coreografia inteira — inclusive a transição capa→portão — é CSS declarativo.

**O que a pesquisa mudou na spec:** não existe link profundo utilizável na
plataforma de reservas. Os quatro portões terminam na mesma busca, e o texto dos
CTAs para de prometer filtro. Ver "Correções à spec" abaixo.

## Technical Context

**Language/Version**: TypeScript 5.9 + Astro 5.16, saída estática. CSS puro com
custom properties; nenhum framework de UI.

**Primary Dependencies**: `astro`, `@astrojs/sitemap`, `@astrojs/vercel`.
**Nenhuma adicionada** (FR-040). Dev: `playwright`, `@astrojs/check`.

**Storage**: N/A — não há banco, não há `pg`, não há `DATABASE_URL`, não há
`/api/lead`. `output: "static"` permanece.

**Testing**: `node --test test/*.test.mjs` (sem framework), mais três
verificadores próprios: `logos/contraste.mjs`, `logos/verificar.mjs`
(Playwright contra o build servido) e `astro check`.

**Target Platform**: navegadores modernos; degradação declarada e testada para
sem-JS, sem `animation-timeline`, sem View Transitions, `prefers-reduced-motion`
e `(hover: none)`.

**Project Type**: site estático de captação, uma única superfície pública.

**Performance Goals**: LCP mediano ≤ 800ms por rota (alvo da faixa: 1500ms);
CLS ≤ 0,01; JS enviado ao cliente = 0 bytes; INP n/d (não há interação com JS).

**Constraints**: 0 dependência de runtime; 1 arquivo de fonte (Plex Mono 600
subset, 15,6 kb); grão é **uma** camada `fixed` no site inteiro; altura de
célula fixa e reservada antes de qualquer animação; nome de destino ≤ 12
caracteres.

**Scale/Scope**: 9 rotas servidas (8 no sitemap), 4 portões novos, 31 nomes de
destino, 4 tabelas de keyframe, ~10 invariantes verificáveis.

**Unknowns**: nenhum. Os dois `[NEEDS CLARIFICATION]` da spec estão fechados —
R1 por medição na plataforma, R2 por decisão registrada do dono (2026-08-28).

## Constitution Check

*GATE: avaliado antes da Phase 0 e reavaliado depois da Phase 1.*

Constituição: `.specify/memory/constitution.md` **v1.0.0** (ratificada
2026-08-28). Seis princípios.

| # | Princípio | Antes da Phase 0 | Depois da Phase 1 | Onde a feature responde |
|---|---|---|---|---|
| **I** | HTML estático primeiro — aqui, zero JavaScript | ✅ | ✅ | FR-039/FR-040. Coreografia 100% CSS; transição de rota por `@view-transition` declarativo, **não** pelo `ClientRouter` do Astro (que custaria ~7 kb — recusado em `research.md` §R5). SC-005 mede 0 byte nas nove rotas. |
| **II** | Fonte única por domínio | ⚠ → ✅ | ✅ | FR-032: as listas de destino alimentam painel **e** cabeça do portão. `EXTERNOS.busca` continua sendo a única URL de saída. **O risco é V3**: as 4 tabelas de keyframe são dado derivado dos comprimentos das listas. Mitigado por teste que recalcula pela fórmula — sem ele, isto seria violação. |
| **III** | Simplicidade deliberada e marcada | ✅ | ✅ | Zero dependência nova. Alternativas mais simples nomeadas e recusadas por escrito em `research.md` (§R3, §R5). Três macroestruturas para nove páginas é o **mínimo** exigido pelo G33 + FR-017, não uma camada especulativa. |
| **IV** | Falhar fechado, nunca mentir para o usuário | ⚠ → ✅ | ✅ | **É o princípio que decidiu R1.** Mandar o visitante para `flight-list` faria a plataforma dizer "nenhum voo foi encontrado" a quem não buscou — o site produzindo afirmação falsa. Também: o texto oculto "abre em nova aba" sai das linhas do painel, que passam a ser internas. |
| **V** | Acessibilidade e contraste são requisito medido | ✅ | ✅ | FR-034 a FR-038, SC-001 (≥45 pares, 0 reprovados), SC-007 (teclado), SC-008 (reduced-motion por rota). Checador continua lendo `tokens.css` — nenhuma cópia da paleta em hex. FR-035: toda superfície nova declara qual anel de foco usa. |
| **VI** | Número não se inventa; alegação vem com caminho de verificação | ⚠ → ✅ | ✅ | **É o princípio que decidiu R2**: país/região em vez de cidade, porque "a busca vende Orlando" afirma inventário de terceiro. FR-029/030 (teste estendido para hora e número de voo), FR-031 (caminho de verificação), FR-021 (marca de terceiro em tipografia, nunca logotipo), S4 do contrato de schema (nenhum `offers`). |

**Veredito: passa nos seis, sem violação a justificar.** A tabela
"Complexity Tracking" fica vazia.

Os três ⚠ da coluna "antes" não eram reprovações — eram os pontos em que a spec
*podia* violar o princípio dependendo de como as pendências fossem resolvidas.
Os três foram fechados pela Phase 0, e é isso que a pesquisa entregou de mais
valioso.

### Portão de conformidade obrigatório

A governança exige `/speckit-analyze` antes de `/speckit-implement` em features
que toquem **conteúdo de preço, registro ou marca de terceiro**. Esta feature
toca os três (FR-029, FR-031, FR-021). **`/speckit-analyze` não é opcional
aqui.**

## Correções à spec (levantadas pela Phase 0, não silenciosas)

| # | Onde | A spec diz | O medido diz | Efeito |
|---|---|---|---|---|
| 1 | FR-016 (bloco 5), FR-023 | portão abre a busca "já filtrada" por produto | a plataforma não aceita link profundo utilizável; selecionar produto não muda a URL, e as rotas de resultado afirmam "nenhum voo foi encontrado" a quem não buscou | os 4 portões apontam para a mesma busca; o CTA para de prometer filtro e passa a dizer que a aba de produto se escolhe do outro lado |
| 2 | SC-011 | "Sitemap com 9 URLs" | 4 hoje + 4 portões = **8**; `/404` não entra em sitemap | critério medível vira **8** |
| 3 | SC-002 | "5 rotas × 3 larguras × 4 rolagens" | O `5` não é a contagem de antes da feature nem de coisa nenhuma — **a linha de base é 1**: `verificar.mjs` visita a capa e só ela (`:77`, sem laço de rota), e os quatro quadros especiais estão amarrados a ela. Depois da feature são 8 públicas + `/404` = **9** | `verificar.mjs` cobre **9 rotas** — e chegar lá é **criar** o laço, não parametrizá-lo (T053) |
| 4 | FR-007 | "não pode estourar a janela" (sem número) | `"BUENOS AIRES"` (12 caracteres) ocupa 79% da janela de 18ch — teto já provado em `global.css` | regra numérica: **≤ 12 caracteres**, verificada por teste |

Correções 2 e 3 têm a mesma raiz: o autor contou 5 + 4 = 9 rotas e usou o 9 no
lugar errado. Nenhuma delas afrouxa a spec.

## Project Structure

### Documentation (this feature)

```text
specs/001-painel-e-portoes/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Phase 0 — os dois NEEDS CLARIFICATION, fechados
├── data-model.md        # Phase 1 — as estruturas de conteúdo e as invariantes
├── quickstart.md        # Phase 1 — como provar que funciona
├── contracts/
│   ├── rotas.md              # URLs, destinos de saída, não-colisão com o hub
│   ├── dados-estruturados.md # JSON-LD dos portões, title/BLUF, o que é proibido
│   └── coreografia.md        # as 4 camadas, a aritmética do ciclo, o piso
└── tasks.md             # Phase 2 — /speckit-tasks, NÃO criado aqui
```

### Source Code (repository root)

```text
src/
├── consts.ts                    # inalterado (EXTERNOS.busca ganha o porquê medido)
├── data/
│   └── conteudo.ts              # ALTERADO — PRODUTOS +4 campos; DESTINOS morre;
│                                #   COBERTURA, FICHA e os dados do bloco 3 nascem
├── components/
│   ├── Faixa.astro              # inalterado (view-transition-name: faixa continua)
│   ├── Logo.astro               # inalterado
│   ├── Rodape.astro             # inalterado
│   ├── Linha.astro              # NOVO — a linha da placa com coluna de destino
│   └── CabecaDePortao.astro     # NOVO — bloco 1, varia por produto.objeto
├── layouts/
│   └── Base.astro               # ALTERADO — nó Service por portão no @graph
├── pages/
│   ├── index.astro              # ALTERADO — .destino sai; 4 colunas entram
│   ├── passagens-aereas.astro   # NOVO
│   ├── hoteis.astro             # NOVO
│   ├── pacotes.astro            # NOVO
│   ├── aluguel-de-carro.astro   # NOVO
│   ├── llms.txt.ts              # ALTERADO — 4 rotas novas
│   ├── robots.txt.ts            # ALTERADO — 4 rotas novas
│   ├── sobre.astro | privacidade.astro | termos.astro | 404.astro  # inalterados
└── styles/
    ├── tokens.css               # ALTERADO — --pa-cascata; tokens das superfícies novas
    └── global.css               # ALTERADO — 4 @keyframes ciclo-N; .portao; vt-<codigo>

test/
└── placa.test.mjs               # ALTERADO — V1..V8 (hoje cobre parte de V2, V6, V7)

logos/
├── contraste.mjs                # ALTERADO — pares das superfícies novas (37 → ≥45)
└── verificar.mjs                # ALTERADO — itera as 9 rotas; quadro de transição
```

**Structure Decision**: continua um único projeto Astro estático, sem camadas
novas. Os dois componentes novos existem porque a mesma marcação aparece 4×
(linha do painel) e 4× (cabeça de portão) — quatro usos é reuso real, não
abstração especulativa (Princípio III). Nenhum diretório novo além de
`specs/001-painel-e-portoes/contracts/`.

## A ordem de construção (e por que ela é essa)

Não é cronograma; é a ordem em que cada etapa **pode ser provada**. Detalhe por
tarefa é `/speckit-tasks`.

1. **Conteúdo e tipos** — `PRODUTOS` com os quatro campos novos, as quatro
   listas, `DESTINOS` removido. Prova: `npm run check`.
2. **O teste, antes do CSS.** V1, V3, V4, V5 escritos e **falhando** contra o
   CSS atual. É a única ordem que garante que a fórmula das tabelas está no
   teste e não só na cabeça de quem escreveu.
3. **As quatro colunas na capa.** `.destino` absorvido, 4 tabelas de keyframe,
   cascata de 120ms. Prova: teste verde, `npm run verificar` com o quadro de
   reduced-motion e CLS ≤ 0,01.
4. **As quatro rotas, esqueleto.** Slugs, `<title>`, BLUF, nó `Service`,
   sitemap 8, `llms.txt`/`robots.txt`. Prova: build + V8 + não-colisão com o hub
   reconferida.
5. **Os quatro portões, um por vez, cada um até o fim.** Construir os quatro
   blocos 1 e depois os quatro blocos 2 é o caminho mais curto para quatro
   páginas clonadas — que reprova a spec inteira por FR-020.
6. **A transição capa→portão.** Só existe depois de as duas pontas existirem.
   Prova: quadro da transição + caminho de degradação limpo.
7. **Contraste e verificação finais.** ≥45 pares, 9 rotas × 3 larguras × 4
   rolagens, teclado, console. Depois: entrada em `.art/log.json` (SC-013).

## Riscos que o plano carrega para as tasks

| Risco | Onde mora | Mitigação já decidida |
|---|---|---|
| **Tabela de keyframe divergindo da lista** — não quebra build, não quebra tipo, não suja console | `global.css` × `conteudo.ts` | V3: o teste recalcula as quatro tabelas pela fórmula. Escrito **antes** do CSS (etapa 2) |
| **Quatro portões clonados** | portões | V1 pega valor repetido; a etapa 5 (um portão por vez, até o fim) e o olhar lado a lado do `quickstart.md` pegam o resto |
| **A janela da coluna é menor dentro da linha** que os 18ch do widget de hoje — a linha divide o espaço com código, nome, abrangência e estado | capa, 46rem e 360px | medição obrigatória nas três larguras antes de fechar a etapa 3; `CENTRO-OESTE` (12) é o pior caso |
| **Rótulo quebrando em 360px** — a mono já quebrou duas vezes por 1px, está no log | capa e portões | qualquer mudança de padding na linha exige remedir as quatro colunas nas três larguras (SC-010) |
| **`verificar.mjs` ficando lento** — 9 rotas × 3 × 4 mais os quadros especiais | ferramenta | é custo de ferramenta, não de página; se incomodar, a saída é paralelizar, **não** reduzir a cobertura |
| **Hub publicando `/viagens/*` depois da entrega** | fora deste repo | única forma de a feature criar canibalização depois de pronta; reconferido antes do merge e registrado |

## Complexity Tracking

> Preenchido apenas se o Constitution Check tiver violações a justificar.

**Vazio.** Nenhuma violação: zero dependência nova, zero JavaScript, zero rota
dinâmica, nenhum princípio afrouxado. As duas decisões que *poderiam* ter virado
violação — link profundo e listas de destino — foram fechadas pela Phase 0 no
lado do princípio.
