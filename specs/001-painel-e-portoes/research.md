# Phase 0 — Research: o saguão

**Feature**: `001-painel-e-portoes` · **Data**: 2026-08-28

Este documento fecha os dois `[NEEDS CLARIFICATION]` que a spec declarou
bloqueantes e resolve as decisões técnicas que o desenho da Phase 1 precisa ter
em mãos. Cada decisão traz o que foi escolhido, por quê, e o que foi recusado.

---

## R1 — Link profundo por produto na OnerTravel

> `[NEEDS CLARIFICATION]` da spec: "Resolver **testando a plataforma**, antes do
> `/plan` — não por suposição."

### Decisão

**Não existe link profundo utilizável. Os quatro portões apontam para
`EXTERNOS.busca` (a home da plataforma), e nenhum texto de CTA promete busca
filtrada.**

### Como foi testado

Playwright (o mesmo que já está no repo), Chromium, 1440×900, contra
`br.onertravel.com/autogestorviagens/*`. Três medições:

**1. A home é uma URL só.** O widget de busca tem seis abas de produto —
`Voos`, `Hotéis`, `Pacotes (Voo + Hotel)`, `Carros`, `Exclusivos`, `Seguros` —
e **clicar em qualquer uma não muda a URL**:

```
clique "Hotéis" -> https://br.onertravel.com/autogestorviagens/home
clique "Carros" -> https://br.onertravel.com/autogestorviagens/home
```

A seleção de produto é estado de cliente. Nenhum parâmetro de query é lido pela
aplicação (varredura do bundle Angular: `main-*.js` + 39 chunks, zero
`queryParamMap.get()` de chave de aplicação).

**2. As rotas de resultado existem e respondem.** O enum de rotas da plataforma
(`chunk-JE76JNP2.js`) declara `flight-list`, `hotel-list`, `car-list`,
`combined`, `tickets`, `travel-insurance-list`, entre outras. Todas carregam
por acesso direto, sem redirecionar para a home.

**3. E é exatamente por isso que elas não servem.** Abertas sem busca prévia,
três das quatro **afirmam um resultado negativo que nunca foi pesquisado**:

| Rota | O que a página diz a quem chega direto |
|---|---|
| `flight-list` | "Exibindo 0 de 0 voos encontrados" · **"Desculpe, nenhum voo foi encontrado."** |
| `car-list` | "Exibindo 0 de 0 opções de carros encontrados" |
| `combined` | **"Desculpe, não encontramos nenhum resultado para a sua busca."** |
| `hotel-list` | "Use o formulário acima para buscar hotéis. Informe destino, datas e hóspedes para começar." — o único que degrada honestamente |

### Rationale

Mandar o visitante para uma tela que diz "nenhum voo foi encontrado" quando ele
não buscou nada é fazer o site produzir uma afirmação falsa sobre o inventário
da plataforma. Isso viola o **Princípio IV** ("nenhuma tela afirma um estado que
não ocorreu") e envenena justamente o momento de maior intenção do funil — a
pessoa leu o portão inteiro, tocou em buscar, e a primeira frase do outro lado é
uma negativa.

Uma busca *pré-preenchida* também não é possível por outro motivo, independente
deste: ela exigiria origem, destino e datas, que uma página estática não tem
como saber. Não há nada a filtrar sem perguntar antes.

### Alternativas consideradas e recusadas

- **`hotel-list` para o portão HTL e `home` para os outros três.** Recusada: o
  único portão com comportamento diferente vira uma exceção não explicável ao
  usuário, e depende de uma tela de estado vazio de terceiro que pode mudar sem
  aviso. Quatro portões, um destino.
- **Deep link com parâmetros inventados** (`?produto=aereo`). Recusada por
  medição: a aplicação não lê parâmetro nenhum. Seria um enfeite na URL.
- **Pedir à OnerTravel um parâmetro de produto.** Fora do escopo desta spec e
  fora deste repositório. Fica registrado como pedido possível ao fornecedor; se
  um dia existir, muda **uma constante** e o texto de um botão.

### Consequências para os requisitos

| Requisito | Ajuste |
|---|---|
| **FR-016 (bloco 5, "Ação")** | A tecla leva à busca **geral**, não à busca do produto. O texto diz o que acontece: abre a busca, em nova aba, na plataforma de reservas — e a pessoa escolhe o produto lá. |
| **FR-023** | Ganha uma segunda verdade a declarar junto com "muda de ambiente visual": **a aba de produto precisa ser escolhida do outro lado**. Sem isso o portão promete um filtro que o clique não entrega. |
| **FR-032 / Princípio II** | Continua uma constante só (`EXTERNOS.busca`), agora reforçada: não nascem quatro URLs de destino. |

### Achado colateral (entra no conteúdo dos portões)

A plataforma vende **seis** produtos; este site cobre **quatro**. `Exclusivos` e
`Seguros` existem do outro lado e **não** são desta vertical — seguro viagem é
assunto da corretora do grupo e tem site próprio (`seguros`). Nenhum portão pode
sugerir que o site cobre os seis, e nenhum pode sugerir que o seguro se compra
aqui. O FAQ da capa já trata o seguro com o registro SUSEP e o caminho de
verificação; os portões não repetem o assunto.

---

## R2 — Quem assina as quatro listas de destino

> `[NEEDS CLARIFICATION]` da spec: "Ou o dono assina as quatro listas, ou elas
> caem para país/região, que são inquestionáveis."

### Decisão

**País/região.** Decisão do dono, 2026-08-28.

### Rationale

"A busca vende Orlando" é uma afirmação sobre o inventário de um terceiro, que
muda sem aviso e que ninguém consegue conferir a partir da página — é o gate G9
disfarçado de conteúdo, e cai sob o **Princípio VI**. "A busca cobre a
Argentina" é verdade por definição do produto: uma busca de passagem
internacional cobre países, e a abrangência já está declarada em `PRODUTOS`
(`onde: "Brasil e exterior"`). Região não envelhece, não depende de contrato de
consolidador e não precisa de revisão trimestral.

O custo é ser menos concreto que um nome de cidade. É aceito: a coluna que vira
é o **motor da direção**, não o argumento de venda — o argumento mora no bloco 2
de cada portão, em texto que pode ser específico sem afirmar inventário.

### Consequências

- **FR-005** fica: quatro listas de comprimentos coprimos. Nomes de país e
  região, não de cidade.
- **FR-007** ganha um número: **≤ 12 caracteres**, herdado por medição, não por
  gosto — `"BUENOS AIRES"` (12) ocupa 79% da janela de 18ch e é o teto já
  provado em `global.css`. Verificado por teste.
- O `DESTINOS` de hoje (8 cidades) **deixa de existir** e é substituído pelas
  quatro listas. Nenhum nome de cidade sobrevive na coluna que vira.

### Alternativa recusada

**Misto** (cidade só em CAR, onde a retirada é sempre uma cidade). Recusada pelo
dono: a regra de conteúdo deixaria de ser uma só, e uma regra por coluna é o tipo
de exceção que a próxima pessoa não conhece.

---

## R3 — A aritmética dos comprimentos coprimos

### Decisão

**5 / 7 / 8 / 11**, mantendo `--pa-parada: 2.2s` igual nas quatro colunas.

### A conta

O período de repetição da combinação visível é o mmc dos quatro ciclos. Com a
mesma parada em todas:

```
mmc(5, 7, 8, 11) = 3080 paradas
3080 × 2,2s      = 6776s = 1h 52min 56s
```

**FR-005 pede ≥ 1 hora; a escolha entrega 1h52.** SC-012 (2 minutos de
observação sem repetição) passa com margem de 56×.

Total de nomes a escrever: **31**.

### O que isso custa em CSS, e é o risco técnico número um desta feature

O keyframe `ciclo` de hoje é escrito para **N = 8**: a pá fica visível de 1% a
12.5% (`100/8`) e sai em 13.5% (`+1%`, e esse 1% é `--pa-giro ÷ --pa-total`).
Com quatro comprimentos diferentes, as porcentagens mudam por coluna — a
velocidade física do giro tem que ser a mesma nas quatro (uma pá não gira mais
rápido porque a lista é menor), então o que varia é a fração:

```
giro%  = --pa-giro ÷ (N × --pa-parada) × 100 = 8/N %
visível de giro% até (100/N)%
sai    de (100/N)% até (100/N + giro%)%     ← a sobreposição deliberada
```

| N | ciclo | giro% | pá visível até | sai até |
|---|---|---|---|---|
| 5 | 11,0s | 1,600% | 20,000% | 21,600% |
| 7 | 15,4s | 1,143% | 14,286% | 15,429% |
| 8 | 17,6s | 1,000% | 12,500% | 13,500% |
| 11 | 24,2s | 0,727% | 9,091% | 9,818% |

Seletor de keyframe não aceita `var()`, então **são quatro tabelas de keyframe,
não uma**. É exatamente a classe de defeito que fez `test/placa.test.mjs`
existir: mexer no comprimento de uma lista sem refazer a tabela não quebra
build, não quebra tipo, não suja o console — só faz a placa piscar em branco ou
repetir destino, e ninguém abre o CSS de novo.

**Mitigação (obrigatória, não opcional):** o teste passa a **recalcular as
quatro tabelas pela fórmula acima**, a partir dos tokens e dos comprimentos
reais das listas, e a falhar em qualquer divergência — incluindo a sobreposição
de saída, que já é guardada hoje.

### Alternativas recusadas

- **Um keyframe só, variando `animation-duration` por coluna.** Recusada: faria
  a lista de 5 girar duas vezes mais rápido que a de 11. Pá de placa tem uma
  velocidade só; velocidade variável denuncia que é texto, não peça.
- **Sortear a próxima pá.** Recusada: custa JavaScript e reprova no FR-039. A
  não repetição vem da aritmética, de graça.
- **Quatro listas de mesmo comprimento com offsets diferentes.** Recusada: a
  combinação repetiria a cada ciclo (17,6s), que é o defeito que FR-005 existe
  para evitar.

---

## R4 — A cascata, e por que são dois atrasos e não um

### Decisão

Dois atrasos convivem, com papéis diferentes:

- **Entrada (`.entra`)**: 60ms entre irmãs, como já é hoje (`--atraso: 160 + i*60`).
  É a chegada da página.
- **Giro das colunas (FR-006)**: 120ms entre irmãs, aplicado como
  `animation-delay` negativo sobre o ciclo de cada coluna.

### Rationale

São gestos distintos: a entrada acontece uma vez, a cascata do giro acontece
para sempre. 120ms contra um giro de 176ms faz as quatro pás se sobreporem
parcialmente — a cascata lê como *uma* onda descendo o painel. Com 60ms elas
quase coincidem (lê como quatro coisas ao mesmo tempo); com 300ms elas se
separam (lê como quatro coisas independentes). O intervalo útil é entre metade e
uma vez o giro; 120ms fica em 68%.

O atraso negativo é o que mantém o custo em zero: cada coluna nasce já adiantada
na própria linha do tempo, sem timer e sem JS.

---

## R5 — A transição capa → portão, sem JavaScript

### Decisão

View Transitions **cross-document nativas**, via `@view-transition { navigation: auto }`
(já declarado em `global.css`), com um `view-transition-name` por código de
produto atribuído em CSS a partir de um atributo no elemento.

### Rationale

O par que atravessa é: a **coluna de destino da linha ativada** na capa → o
**objeto da cabeça** do portão. Para o par existir, o mesmo nome de transição
precisa estar nas duas páginas, e nomes precisam ser únicos por documento — daí
o nome ser por produto (`--vt-aer`, `--vt-htl`, `--vt-pct`, `--vt-car`) e não um
nome genérico.

`view-transition-name: faixa` continua onde está: FR-026 diz que o nome novo se
**soma**, não substitui. A faixa atravessa, o objeto vira. São duas partes do
mesmo gesto.

Degradação (FR-027): navegador sem suporte ignora a regra inteira e navega
normalmente. Nada a detectar, nada a poligonar, zero bytes. Sob
`prefers-reduced-motion: reduce` (FR-028), a transição é desligada por
`@media` — o conteúdo é idêntico nos dois casos.

### Alternativa recusada

**Transição via `astro:transitions` (ClientRouter).** Recusada: custa ~7 kb de
JavaScript e reprova no FR-039 e no Princípio I. A versão declarativa entrega o
mesmo gesto por 0 byte, com o preço de não ter controle fino — preço aceito.

---

## R6 — As quatro rotas, e o que elas custam fora do CSS

### Decisão

Quatro páginas estáticas em `src/pages/`, uma por produto, com slug em
português por termo de busca: `/passagens-aereas`, `/hoteis`, `/pacotes`,
`/aluguel-de-carro` (FR-015).

### Achados que a Phase 1 precisa carregar

**O sitemap fica com 8 URLs, não 9.** SC-011 diz 9; a conta não fecha e a spec
está errada por um. O sitemap de hoje tem **4** (`/`, `/privacidade`, `/sobre`,
`/termos` — verificado em `dist/sitemap-0.xml`); `/404` não entra em sitemap. Com
os quatro portões: **8**. O critério medível vira **8**, e SC-011 é corrigido na
mesma leva — não silenciosamente.

**`llms.txt` e `robots.txt`** são endpoints TypeScript (`src/pages/*.ts`) e
listam rotas à mão. Os quatro portões entram nos dois (FR-041), e a declaração
em maiúsculas sobre ausência de preço passa a valer explicitamente para eles.

**Colisão com o hub: verificada, não assumida.** O hub publica apenas o 301 de
`/viagens` e nenhuma sub-rota (`autogestor/astro.config.mjs`, checado na sessão
de clarificação da spec). Nenhum dos quatro slugs novos colide. A verificação é
refeita antes do merge, porque é a única forma de esta feature criar
canibalização depois de entregue.

---

## R7 — Contraste: de 37 para ≥ 45 pares

### Decisão

Cada superfície nova entra em `logos/contraste.mjs` **antes** de existir no CSS,
não depois.

### Rationale

O checador já pegou um defeito antes de a página existir (borda do botão de
contorno a 2.32:1 sobre a placa, contra os 3:1 da WCAG 1.4.11) — foi assim que
`--noite-600` foi parar em `L 0.505`. As superfícies novas desta feature são
justamente as de maior risco: a cabeça de portão em escala de objeto, a fresta
da grade de duas colunas do PCT, a grade de códigos IATA do CAR, e o anel de
foco sobre cada uma delas (FR-035).

O checador **continua lendo `tokens.css`** e resolvendo `var()` + OKLCH na hora.
Nenhuma cópia da paleta em hex entra no script — isso é proibido pelo
Princípio II e pelo Princípio V da constituição, não é preferência.

SC-001 fica: 0 reprovados, ≥ 45 pares medidos.

---

## R8 — O que NÃO foi pesquisado, de propósito

- **Fotografia** (opção C da rodada de direção): fora de escopo declarado.
- **Captação de lead**: fora de escopo declarado. Continua sem banco, sem
  `/api/lead`, sem `pg`.
- **Troca de plataforma de reserva**: a OnerTravel é premissa da spec.
- **Alternador de tema**: uma banda só; a ausência é decisão.

---

## Pendências restantes

Nenhuma. Os dois `[NEEDS CLARIFICATION]` estão fechados — R1 por medição na
plataforma, R2 por decisão registrada do dono. A Phase 1 pode começar.
