# Quickstart — como provar que o saguão funciona

**Feature**: `001-painel-e-portoes`

Nenhuma afirmação de "pronto" vale sem a saída destes comandos vista com os
próprios olhos (Princípio: portão de conclusão). As quatro ferramentas já
existem no repositório; esta feature estende três delas.

## Pré-requisitos

```powershell
npm install          # nada novo a instalar: 0 dependências adicionadas (FR-040)
```

Nenhuma variável de ambiente em desenvolvimento. Em produção existe uma só,
`SITE_URL` — e `SITE_URL` inválida **não derruba o build**: cai no domínio de
produção com aviso no log. Conferir a variável continua sendo obrigação de quem
publica.

## A sequência, em ordem

```powershell
npm test          # a conta da placa + as invariantes de verdade
npm run check     # tipos — 0 erros
npm run contraste # os pares de cor, lidos de tokens.css
npm run build     # gera .vercel/output/static
npm run verificar # a prova no navegador, contra o BUILD
```

**`npm run verificar` roda depois de `npm run build`, sempre.** O `astro dev`
injeta a barra de ferramentas do Astro — DOM extra e ~1,8 MB de JavaScript que
não existem em produção. Medir ali é medir outra página; é por isso que
`logos/verificar.mjs` sobe um servidor estático em cima do build.

---

## O que cada comando precisa devolver

### `npm test` — as invariantes

Cobre V1–V8 do [data-model.md](../001-painel-e-portoes/data-model.md#7-resumo-das-invariantes-verificáveis).
Falha esperada se alguém:

- der a dois portões o mesmo `objeto` ou o mesmo `detalhe` (**V1** — FR-020,
  a regra que impede quatro portões clonados);
- "consertar" a sobreposição das pás fazendo a saída caber no slot (**V2** — a
  janela passaria a piscar em branco a cada troca);
- mudar o comprimento de uma lista sem refazer a tabela de keyframe daquele `N`
  (**V3** — é a razão de este teste existir: não quebra build, não quebra tipo,
  não suja o console);
- quebrar a coprimalidade dos quatro comprimentos (**V4**);
- escrever um destino com mais de 12 caracteres, com nome de cidade, ou fora da
  caixa alta (**V5**);
- deixar escapar um `R$`, uma hora de voo ou um número de voo em qualquer rota
  servida (**V6** — o teste lê o `dist`, não a fonte);
- apontar um CTA externo para qualquer coisa que não seja `EXTERNOS.busca`
  (**V7** — inclusive para `flight-list`, `hotel-list`, `car-list` ou
  `combined`, que dizem "nenhum voo foi encontrado" a quem não buscou);
- publicar um slug repetido ou colidente (**V8**).

### `npm run contraste`

```
… pares medidos, 0 reprovados.
```

**≥ 45 pares, 0 reprovados** (SC-001). Sobe dos 37 de hoje porque cada
superfície nova entra na medição — cabeça de portão, fresta de duas colunas do
PCT, grade IATA do CAR, e o anel de foco sobre cada uma delas.

Sai com código 1 se qualquer par reprovar. O script **lê `tokens.css`** e
resolve `var()` + OKLCH na hora: se alguém adicionar uma cópia da paleta em hex
dentro dele, a mudança é rejeitada — duas fontes da verdade para a mesma cor é
o defeito, não a conveniência.

Rode-o **antes** de o par de cor entrar no CSS, e escreva o valor medido ao lado
da declaração.

### `npm run build`

- `astro check` limpo antes (`npm run check`).
- **Sitemap com 8 URLs** (`dist/sitemap-0.xml`) — as 4 de hoje mais os 4
  portões. `/404` nunca entra em sitemap.
- Zero `.js` em `.vercel/output/static` (SC-005).

### `npm run verificar` — a prova no navegador

**9 rotas × 3 larguras × 4 posições de rolagem**, mais os quadros especiais.
Falha com código 1 se estourar o `ORCAMENTO` declarado no topo do script.

O que precisa aparecer na saída e nos `logos/_verificacao/`:

| Prova | Critério |
|---|---|
| LCP mediano por rota | ≤ 800ms (alvo da faixa: 1500ms), 5 amostras, CPU 4× estrangulada |
| Elemento de LCP da capa | continua `H1.placa__titulo` |
| CLS | ≤ 0,01 nas nove rotas |
| JS servido | 0 bytes |
| Console | limpo, nas três larguras, em todas as rotas |
| Estouro horizontal | nenhum, em nenhuma combinação |
| Teclado | toda parada com anel de foco visível, contraste ≥ 3:1 contra a superfície onde aparece |
| Quadro de `prefers-reduced-motion` | um por rota: painel **inteiro e parado**, um destino visível por linha, vinco e moldura no lugar |
| Quadro da transição capa→portão | a célula virando no objeto do portão |
| Degradação sem View Transitions | navegação normal, sem erro no console |
| Quadro de hover no painel | a célula de estado indo de `24h` para `Abrir` |
| Quadro em 360px por portão | nenhum rótulo da placa quebrando em duas linhas |

---

## Os três olhares que ferramenta nenhuma faz

Passar nos comandos não é a mesma coisa que estar certo. Antes de declarar
pronto, olhe:

1. **O painel ocioso por dois minutos** (SC-012). As quatro colunas não podem
   mostrar a mesma combinação duas vezes. A conta diz que a repetição só volta
   em 1h52; os dois minutos são para pegar o caso em que a conta está certa e o
   CSS não.
2. **Os quatro portões lado a lado** (FR-020). Se dois se parecem, a spec
   reprova — por melhor que cada um esteja sozinho. O teste pega valor
   repetido; ele não pega quatro desenhos diferentes que *lêem* igual.
3. **A pá no meio da queda.** Os três quadros congelados pela Web Animations API
   provam que a luz corre atrás do ângulo, em vez de a peça aterrissar já acesa.
   É a diferença entre uma superfície e um texto girando, e ela não aparece em
   quadro parado.

## Depois de tudo passar

`.art/log.json` ganha uma entrada (SC-013) registrando o que foi construído, o
que foi construído **e removido**, e as correções encontradas *olhando a tela* —
não só as previstas. A entrega anterior corrigiu um defeito de superfície chapada
que **nenhum gate pegou**; quem pegou foi olhar.
