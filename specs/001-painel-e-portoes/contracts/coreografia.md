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

| Situação | Comportamento contratado |
|---|---|
| Suporte a View Transitions | célula vira no objeto do portão |
| Sem suporte | navegação normal, sem transição, **sem erro no console**, sem perda de conteúdo |
| `prefers-reduced-motion: reduce` | transição desligada; a navegação continua |

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
