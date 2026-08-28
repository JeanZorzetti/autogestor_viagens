# Phase 1 — Data Model: o saguão

**Feature**: `001-painel-e-portoes` · **Data**: 2026-08-28

Não há banco. "Modelo de dados" aqui significa **as estruturas literais em
`src/data/conteudo.ts` e `src/consts.ts`** e as regras de verdade que valem
sobre elas. Regra que manda no arquivo inteiro, herdada: nenhum valor aqui é
inventado, e nenhuma string de fato nasce dentro de um `.astro` (FR-032).

---

## 1. `Produto` — transformado (4 registros)

Já existe em `PRODUTOS`. Ganha quatro campos; nenhum campo existente muda de
significado.

| Campo | Tipo | Novo? | Regra |
|---|---|---|---|
| `codigo` | `"AER" \| "HTL" \| "PCT" \| "CAR"` | — | 3 letras maiúsculas. É a linguagem do painel, **não** a da URL. |
| `nome` | `string` | — | Rótulo humano. Mede ≤ 154px em mono 16px (o teto que já quebrou duas vezes). |
| `onde` | `string` | — | Abrangência. Fato sobre o produto, não sobre inventário. |
| `nota` | `string` | — | Uma linha. Não repete `nome` nem `onde`. |
| `icone` | `string` (SVG interno) | — | Traço em `currentColor`, `viewBox="0 0 24 24"`. |
| **`rota`** | `string` | ✅ | Slug em português, com barra inicial, sem barra final. Um por produto, único. |
| **`destinos`** | `readonly string[]` | ✅ | A lista da coluna que vira. Ver §2. |
| **`objeto`** | `"par" \| "faixa" \| "duasMetades" \| "campoUnico"` | ✅ | Qual objeto a cabeça do portão amplia (FR-020). **Valor único entre os quatro.** |
| **`detalhe`** | `"comparacao" \| "estados" \| "duasColunas" \| "grade"` | ✅ | Tipo do bloco 3 (FR-020). **Valor único entre os quatro.** |

### Instâncias

| `codigo` | `rota` | `objeto` | `detalhe` |
|---|---|---|---|
| `AER` | `/passagens-aereas` | `par` — duas pás, ida ‖ volta | `comparacao` — companhias lado a lado |
| `HTL` | `/hoteis` | `faixa` — pá única sobre faixa de noites | `estados` — regimes como 4 estados da mesma pá |
| `PCT` | `/pacotes` | `duasMetades` — voo em cima, hotel embaixo, o vinco é a emenda | `duasColunas` — entra ‖ não entra, em fresta |
| `CAR` | `/aluguel-de-carro` | `campoUnico` — retirada e devolução no mesmo campo | `grade` — aeroportos de retirada em códigos IATA |

**Invariante V1 (FR-020):** `objeto` e `detalhe` são **injetores** — quatro
produtos, quatro valores distintos em cada campo. Um valor repetido significa
dois portões com o mesmo desenho, e isso reprova a spec inteira. Verificado por
teste, não por revisão.

---

## 2. `ListaDestino` — nova (4 listas, 31 nomes)

Substitui a constante `DESTINOS` (8 cidades), que **deixa de existir**. Cada
lista vive dentro do seu `Produto` (`produto.destinos`): uma fonte, dois usos —
a coluna do painel e a cabeça do portão leem a mesma lista (FR-032).

### Regras de conteúdo

| # | Regra | Origem | Como é verificada |
|---|---|---|---|
| C1 | Só **país ou região**. Nenhum nome de cidade. | R2 (decisão do dono, 2026-08-28) · Princípio VI | teste: lista fechada de exceções vazia |
| C2 | **≤ 12 caracteres** por nome | FR-007 · medido: `"BUENOS AIRES"` (12) ocupa 79% da janela de 18ch | teste |
| C3 | Comprimentos das quatro listas **coprimos dois a dois** | FR-005 | teste (mmc ≥ 1h de ciclo) |
| C4 | Caixa alta, sem pontuação além de hífen | consistência da placa | teste |
| C5 | Nenhum preço, hora ou número de voo | FR-029, FR-030 · Princípio VI | teste (já existe para `R$`, estendido) |

Nome pode repetir **entre** listas (BRASIL aparece em AER e em CAR); repetir
**dentro** de uma lista quebraria o ciclo e é proibido.

### Conteúdo proposto

```
AER — 11 nomes (ciclo 24,2s)
  BRASIL · ARGENTINA · CHILE · PORTUGAL · ESPANHA · URUGUAI
  PARAGUAI · COLÔMBIA · PERU · MÉXICO · ITÁLIA

HTL — 8 nomes (ciclo 17,6s)
  NORDESTE · SUDESTE · SUL · CENTRO-OESTE · NORTE · CARIBE
  EUROPA · PATAGÔNIA

PCT — 7 nomes (ciclo 15,4s)
  NORDESTE · CARIBE · ARGENTINA · CHILE · PORTUGAL · SUL · SUDESTE

CAR — 5 nomes (ciclo 11,0s)
  BRASIL · CENTRO-OESTE · NORDESTE · SUDESTE · SUL
```

Maior nome: `CENTRO-OESTE` (12) — no teto de C2, exatamente onde
`"BUENOS AIRES"` já provou caber. Comprimentos 11 / 8 / 7 / 5: coprimos dois a
dois.

**Repetição da combinação:** `mmc(5,7,8,11) = 3080` paradas × 2,2s =
**6776s = 1h52min56s** (FR-005 pede ≥ 1h; SC-012 observa 2 min).

---

## 3. `TabelaDeCiclo` — derivada, não escrita à mão

Não é um objeto TypeScript: é a tabela de porcentagens do `@keyframes` de cada
coluna, em `global.css`. Está aqui porque **é dado derivado de `ListaDestino` e
dos tokens de tempo**, e dado derivado que ninguém recalcula é como esta placa
quebra em silêncio.

Para cada `N` = comprimento da lista, com `--pa-parada: 2.2s` e
`--pa-giro: 0.176s`:

```
ciclo   = N × --pa-parada
giro%   = --pa-giro ÷ ciclo × 100   =  8/N %
entra:  0% → giro%          (rotateX(-92deg) → 0)
fica:   giro% → 100/N %
sai:    100/N % → (100/N + giro%) %      ← sobreposição deliberada
volta:  (100/N + giro% + 0,1%) → 100%    (escondida)
```

| N | ciclo | giro% | fica até | sai até |
|---|---|---|---|---|
| 5 | 11,0s | 1,600% | 20,000% | 21,600% |
| 7 | 15,4s | 1,143% | 14,286% | 15,429% |
| 8 | 17,6s | 1,000% | 12,500% | 13,500% |
| 11 | 24,2s | 0,727% | 9,091% | 9,818% |

**Invariante V2 (o motivo de `test/placa.test.mjs` existir):** a saída de uma pá
**ultrapassa** o próprio slot e se sobrepõe à entrada da seguinte. Com a saída
contida no slot, a janela fica vazia entre as pás — o gesto principal da página
piscando em branco. Medido quadro a quadro na entrega anterior; o teste falha se
alguém "consertar".

**Invariante V3:** as quatro tabelas são recalculadas pela fórmula acima a
partir de `tokens.css` + dos comprimentos reais das listas. Divergência = teste
vermelho.

---

## 4. `Portao` — novo (4 páginas)

Não é um registro em `conteudo.ts`: é uma **página** que compõe `Produto` +
`ListaDestino` + textos próprios. O que é dado (e portanto mora em
`conteudo.ts`) e o que é página:

| Bloco | O que é | Onde mora |
|---|---|---|
| 1 · Cabeça de portão | código em escala de objeto + coluna girando | markup + `produto.objeto` |
| 2 · O que está atrás | lista densa do que a busca cobre | `conteudo.ts` — `COBERTURA[codigo]: string[]` |
| 3 · Detalhe ampliado | único por portão (`produto.detalhe`) | `conteudo.ts`, forma por portão — ver §4.1 |
| 4 · Ficha | tabela de fatos | `conteudo.ts` — `FICHA[codigo]: {rotulo, valor, fonte?}[]` |
| 5 · Ação | a tecla + advertências | markup, URL de `EXTERNOS.busca` |

### 4.1 A forma do bloco 3, por portão

| Portão | Estrutura do dado | Regra de verdade |
|---|---|---|
| AER `comparacao` | `string[]` de nomes de companhia | FR-021: **tipografia, nunca logotipo**. Sem ativo licenciado no repo. |
| HTL `estados` | 4 × `{regime, oQueInclui}` | Regime é fato do formulário da plataforma, não do inventário. |
| PCT `duasColunas` | `{entra: string[], naoEntra: string[]}` | O que **não** entra é tão obrigatório quanto o que entra. |
| CAR `grade` | `{iata, cidade}[]` | IATA de aeroporto é fato público e verificável. |

### 4.2 Metadados por portão (FR-024)

`titulo`, `descricao` e `bluf` próprios. **Nenhum herda o `<title>` da capa.**
O `bluf` é o primeiro parágrafo e responde a pergunta da busca direto, sem
rodeio.

### 4.3 Ficha — o campo `fonte`

`FICHA[codigo]` aceita `fonte?: {texto, href}`. **Toda alegação verificável
carrega o caminho de verificação** (FR-031 · Princípio VI): é o padrão que o FAQ
já usa com `EXTERNOS.susepConsulta`. Alegação sem `fonte` só é permitida quando
é fato sobre o próprio produto ("a busca cobre voo nacional e internacional"),
nunca quando é registro, licença ou credencial.

**Proibido em qualquer campo de qualquer portão:** preço, "a partir de", tarifa,
hora de voo (`HH:MM` em contexto de painel), número de voo.

---

## 5. `Painel` — transformado (1)

| Antes | Depois |
|---|---|
| 4 linhas + 1 widget `.destino` ao lado | 4 linhas, **cada uma com sua coluna de destino** |
| 1 pá girando | 4 pás girando, em cascata de 120ms |
| Linha = link para fora | Linha = link **para o portão** (interno) |

**Mudança de contrato que precisa ser dita em voz alta:** hoje as quatro linhas
levam para fora do domínio em nova aba (`target="_blank"`), e o rótulo oculto de
leitor de tela diz "abre em nova aba". Depois desta feature elas levam para uma
**rota interna, na mesma aba** — o `target`, o `rel` e o texto oculto saem
(FR-015 + Cenário 3). O aviso de nova aba passa a viver **no bloco 5 de cada
portão**, que é onde o link para fora passa a existir.

Invariantes do painel: exatamente 4 linhas (FR-008, sem linha decorativa);
moldura visível em toda a volta com `--fundo` respirando fora dela (FR-009);
altura de célula fixa e reservada antes de qualquer animação (FR-012); H1 é o
cabeçalho do painel, dono do LCP, e não anima (FR-010).

---

## 6. Constantes que mudam em `src/consts.ts`

| Constante | Mudança |
|---|---|
| `EXTERNOS.busca` | **Nenhuma.** R1 provou que não há link profundo utilizável; continua sendo uma URL só, destino de todo CTA. O comentário ganha a razão medida. |
| `SITE`, `EMPRESA`, `ATENDIMENTO` | Nenhuma. |

Nada novo em `consts.ts`. As quatro rotas vivem em `PRODUTOS` (§1), porque rota
é atributo de produto, não NAP.

---

## 7. Resumo das invariantes verificáveis

| # | Invariante | Requisito | Ferramenta |
|---|---|---|---|
| V1 | `objeto` e `detalhe` distintos entre os 4 produtos | FR-020 | `npm test` |
| V2 | Saída da pá se sobrepõe à entrada da seguinte | FR-005 (herdada) | `npm test` |
| V3 | 4 tabelas de keyframe conferem com a fórmula | FR-005 | `npm test` |
| V4 | Comprimentos coprimos, mmc ≥ 1h | FR-005 | `npm test` |
| V5 | Todo destino ≤ 12 caracteres, país/região, caixa alta | FR-007, C1–C4 | `npm test` |
| V6 | Nenhum `R$`, `HH:MM` de painel ou número de voo no servido | FR-029, FR-030 | `npm test` |
| V7 | Todo CTA externo aponta para `EXTERNOS.busca` | FR-032, R1 | `npm test` |
| V8 | 4 rotas, 4 slugs únicos, 8 URLs no sitemap | FR-015, FR-041 | `npm test` + `npm run build` |
| V9 | Todo par de cor novo medido, 0 reprovados, ≥ 45 pares | FR-034, SC-001 | `npm run contraste` |
| V10 | 9 rotas × 3 larguras × 4 rolagens, console limpo, 0 JS | SC-002 (corrigido), SC-005 | `npm run verificar` |

> **V10 corrige um número da spec.** SC-002 diz "5 rotas" — é a contagem de
> *antes* desta feature. Depois dela são **8 públicas + `/404` = 9**. Ver a
> seção "Correções à spec" no `plan.md`.
