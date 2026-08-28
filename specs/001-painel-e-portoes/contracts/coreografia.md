# Contrato — Coreografia (0 byte de JavaScript)

O movimento é a interface principal deste site, e ela é inteiramente CSS. Este
contrato diz o que cada camada promete, o que ela custa, e como cada uma
degrada. **Se um requisito desta feature exigir JavaScript, ele é cortado — não
é o orçamento que cede** (FR-039).

## 1. As quatro camadas, um verbo só

O verbo é **virar**. Não há fade em lugar nenhum (G11 · uma ideia).

| Camada | Gatilho | O que vira | Mecanismo |
|---|---|---|---|
| Entrada | carga da página | as 4 linhas da placa | `animation` + `--atraso: 160 + i×60` ms |
| Ciclo | tempo (autônomo) | as 4 colunas de destino | `animation` infinita + `animation-delay` negativo |
| Scroll | entrada no viewport | itens da lista densa | `animation-timeline: view()` sob `@supports` |
| Ponteiro | `:hover` | célula de estado `24h` → `Abrir` | `transition`, desligada em `(hover: none)` |
| Rota | navegação | célula → objeto da cabeça | `@view-transition` cross-document |

## 2. O ciclo das colunas — o contrato aritmético

Tokens (fonte única, `tokens.css`):

```
--pa-parada: 2.2s     tempo que uma pá fica parada mostrando seu valor
--pa-giro:   0.176s   tempo de uma pá cair e travar — IGUAL nas quatro colunas
--pa-cascata: 120ms   atraso entre irmãs (FR-006)
```

Para uma coluna de `N` destinos:

```
ciclo   = N × --pa-parada
giro%   = --pa-giro ÷ ciclo × 100  =  8/N %

@keyframes ciclo-N {
  0%                         → rotateX(-92deg), opacity 0
  giro%      … 100/N %       → rotateX(0),      opacity 1
  (100/N + giro%) %          → rotateX(92deg),  opacity 0
  (100/N + giro% + 0,1%) … 100% → rotateX(-92deg), opacity 0
}
```

| N | ciclo | giro% | fica até | sai até |
|---|---|---|---|---|
| 5 | 11,0s | 1,600% | 20,000% | 21,600% |
| 7 | 15,4s | 1,143% | 14,286% | 15,429% |
| 8 | 17,6s | 1,000% | 12,500% | 13,500% |
| 11 | 24,2s | 0,727% | 9,091% | 9,818% |

**Cláusula da sobreposição (não negociável).** A saída ocupa o intervalo
*depois* do slot da pá, sobrepondo a entrada da seguinte. Com a saída contida no
slot sobram ~176ms de **janela vazia** por troca — o gesto principal da página
piscando em branco a cada ciclo. Placa de verdade nunca fica vazia: a pá que
chega tapa a que sai. Medido quadro a quadro; `test/placa.test.mjs` falha se
alguém "consertar".

**Cláusula da velocidade única.** `--pa-giro` é o mesmo nas quatro colunas. Uma
pá não gira mais rápido porque a lista é menor — velocidade variável denuncia
que é texto, não peça. É por isso que são quatro tabelas de keyframe e não uma
com `animation-duration` variável.

**Cascata:** `animation-delay: calc(var(--linha) * -120ms)`. Negativo, para
nascer adiantada em vez de esperar. Custo: 0 byte.

## 3. A transição de rota (FR-025 a FR-028)

```
@view-transition { navigation: auto }          já declarado
view-transition-name: faixa                    já existe — CONTINUA
view-transition-name: vt-<codigo>              NOVO, um por produto
```

O par que atravessa: **coluna de destino da linha ativada** (capa) →
**objeto da cabeça** (portão). O nome precisa existir nos dois documentos e ser
único dentro de cada um — daí ser por código de produto (`vt-aer`, `vt-htl`,
`vt-pct`, `vt-car`) e não um nome genérico.

O nome novo **se soma** ao da faixa, não substitui (FR-026): a faixa atravessa,
o objeto vira. Duas partes do mesmo gesto.

### Cláusula dos três sem par (G4, decidida em 2026-08-28)

A capa tem **quatro** nomes; o portão de destino tem **um**. Numa navegação
capa → `/passagens-aereas`, `vt-htl`, `vt-pct` e `vt-car` existem no documento
velho e não têm par no novo. O navegador aplica neles o
`-ua-view-transition-fade-out` padrão — **fade puro, sozinho, sem giro**, que é
exatamente o que a constituição proíbe.

E é pior que desbotar. Medido em quadro congelado (Chromium 143, protótipo dos
dois documentos, Web Animations API):

| t | `corpo` (velho) | os três sem par |
|---|---|---|
| 60 ms | op 0,22, `rotateX` em curso | op 0,61, **`transform: none`** |
| 140 ms | op 0,02 — praticamente saiu | op 0,14, ainda nítidos e **de pé** |

Os três não têm `::view-transition-group`, então não herdam nada do `corpo`:
ficam parados, retos e legíveis flutuando sobre a página de destino depois que o
corpo de onde foram recortados já saiu. Não é um fade indevido — é um rasgo.

A causa é `main { view-transition-name: corpo }` (`global.css:1096`): elemento
com nome próprio é **retirado do snapshot do ancestral**, então dar nome às
quatro colunas abre quatro buracos no snapshot `corpo` e as quatro passam a
animar por fora do `pa-sai`.

**Contratado:** os quatro nomes existem, e a saída dos quatro é o gesto do
`corpo`, não o fade do navegador. Não há seletor que distinga o par do órfão —
e não precisa haver: a regra certa para os três é a mesma do quarto.

```css
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(vt-aer), ::view-transition-old(vt-htl),
  ::view-transition-old(vt-pct), ::view-transition-old(vt-car) {
    animation: pa-sai var(--dur-base) var(--ease-pa) both;
  }
  ::view-transition-new(vt-aer), ::view-transition-new(vt-htl),
  ::view-transition-new(vt-pct), ::view-transition-new(vt-car) {
    animation: pa-entra var(--dur-pa) var(--ease-pa) both;
  }
}
```

Custo: 0 byte enviado ao cliente. Os três órfãos passam a sair **em lockstep com
o corpo** — no quadro congelado eles ficam indistinguíveis da matéria de onde
saíram, que é o oposto de ruído. O par (`vt-aer`) ganha a mesma troca: o
`::view-transition-group` continua morfando a posição (712 px → 121 px, medido),
e o que era cross-fade `plus-lighter` do navegador vira o giro. A célula voa
para a cabeça do portão **virando**, em uma língua só.

Opção recusada: nomear só a linha ativada. É o correto no conceito e não existe
sem JavaScript — o nome tem que estar no CSS do documento de **origem** antes de
a navegação começar, e nem `@view-transition { types }` (estático por documento,
igual para os quatro links) nem `:target` (não há fragmento) nem `:focus-visible`
(clique de ponteiro não o dispara) distinguem qual das quatro linhas foi
acionada. FR-039 manda cortar o requisito, não o orçamento — e aqui não é
preciso cortar nada: a opção que cabe em 0 byte entrega o mesmo verbo.

### Cláusula do movimento reduzido (G4, achado colateral)

FR-028 e a tabela abaixo contratam "transição de rota desligada" sob
`prefers-reduced-motion: reduce`. **Hoje o CSS não entrega isso**, e foi medido:
as regras de `::view-transition-*(corpo)` moram dentro de
`@media (prefers-reduced-motion: no-preference)` (`global.css:242`), então sob
`reduce` elas simplesmente não se aplicam — e o que sobra é o **cross-fade padrão
do navegador** em `corpo`, `faixa`, `vt-aer` e nos três órfãos, com os grupos
ainda transladando. O caminho de acessibilidade é hoje a versão **mais** cheia de
fade da página. Desligar exige regra própria:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

Medido depois da regra: **zero** animação de pseudo-elemento de transição, página
de destino inteira e correta no primeiro quadro. O `*` é suportado no engine
alvo — confirmado, não suposto.

| Situação | Comportamento contratado |
|---|---|
| Suporte a View Transitions | célula vira no objeto do portão; os quatro nomes saem com `pa-sai`, nenhum com fade puro |
| Sem suporte | navegação normal, sem transição, **sem erro no console**, sem perda de conteúdo |
| `prefers-reduced-motion: reduce` | transição desligada **por regra explícita** — não por omissão, que é o que existe hoje |

**Qual engine prova o "sem suporte" (G3).** Medido em 2026-08-28 com os engines
já instalados no cache local do Playwright:

| Engine | `view-transition-name` | `document.startViewTransition` | `onpagereveal` | VT cross-document |
|---|---|---|---|---|
| Chromium 143 | sim | sim | sim | **sim** |
| WebKit 26 (Safari) | sim | sim | sim | **sim** — não serve de prova |
| Firefox 144 | **sim** | **sim** | não | **não** |

A prova de SC-009 é o **Firefox**, e a pegadinha está na primeira coluna: ele
suporta `view-transition-name` e `document.startViewTransition` (transição
*same-document*) e mesmo assim não faz a transição entre documentos. Qualquer
teste de suporte por `CSS.supports("view-transition-name", …)` dá **falso
positivo** ali. O que separa os dois grupos é `"onpagereveal" in window`.

## 4. O piso: como cada camada morre

Este é o contrato que importa mais que o gesto — é o que a página é para quem
não recebe a coreografia.

| Falta | O que o visitante vê |
|---|---|
| JavaScript desligado | **página idêntica.** Nada da coreografia depende de JS. |
| `animation-timeline` não suportado | `@supports` isola; o conteúdo nasce **visível**, nunca escondido esperando um scroll que não dispara |
| `prefers-reduced-motion: reduce` | painel **inteiro e parado**, um destino visível por linha, o vinco no lugar, moldura no lugar. Nenhuma informação existe só no movimento (FR-036, SC-008) |
| `(hover: none)` | a célula de estado fica em `24h`. Nada exclusivo do ponteiro (G27) |
| Fonte não chega | `font-display: optional` — a Plex Mono não substitui depois de pintar. A métrica do fallback cobre também as colunas novas |

## 5. Restrições de matéria que a coreografia não pode violar

| # | Regra | Gate |
|---|---|---|
| M1 | Fonte de luz única a 200°. Aresta para cima acende, sombra cai para baixo e para a direita. Nenhum elemento novo com sombra em direção própria | FR-001 |
| M2 | Toda sombra sai de `--sombra-cor` (navy fechado). Preto puro sobre objeto azul: proibido | FR-002 · G18 |
| M3 | Todo filete é fresta (fio escuro + fio claro) em superfície de painel. `.doc` continua em filete simples — fichas não são painéis | FR-003 |
| M4 | O grão é **uma** camada `position: fixed` para o site inteiro. Nenhuma superfície nova ganha `::after` próprio | FR-004 |
| M5 | Nenhum `filter` ou `backdrop-filter` dentro de keyframe | FR-038 · G21 |
| M6 | O elemento de LCP (`H1.placa__titulo`) **não anima** opacidade, escala nem posição | FR-010 |
| M7 | Altura de célula fixa (`--celula` / `--celula-mobile`), reservada **antes** de qualquer animação. Nenhuma linha cresce com o conteúdo — é daqui que sai o CLS 0 | FR-012 |

## 6. Orçamento (medido no fim, não estimado)

```
JS enviado ao cliente:  0 bytes  — nas nove rotas (SC-005)
Dependências novas:     0        (FR-040)
Imagens novas:          0
Pesos de fonte novos:   0        — a Plex Mono 600 subset (15,6 kb) cobre tudo
LCP:                    ≤ 800ms por rota, contra alvo de 1500ms (SC-003)
CLS:                    ≤ 0,01 nas nove rotas (SC-004)
```

Verificado por `npm run verificar`, que serve `.vercel/output/static` e falha
com código 1 se o orçamento estourar. O orçamento vive na constante `ORCAMENTO`
do script — não neste documento.
