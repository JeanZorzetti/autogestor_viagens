# Contrato — Rotas e destinos de saída

O que este site expõe ao mundo é **URL**. Este é o contrato: quais existem, o
que cada uma promete, e para onde os cliques saem.

## 1. Rotas servidas (9 depois desta feature)

| URL | Existe hoje? | Macroestrutura | Sitemap |
|---|---|---|---|
| `/` | sim (transformada) | Índice → **Painel** | ✅ |
| `/passagens-aereas` | **nova** | Portão | ✅ |
| `/hoteis` | **nova** | Portão | ✅ |
| `/pacotes` | **nova** | Portão | ✅ |
| `/aluguel-de-carro` | **nova** | Portão | ✅ |
| `/sobre` | sim | `.doc` | ✅ |
| `/privacidade` | sim | `.doc` | ✅ |
| `/termos` | sim | `.doc` | ✅ |
| `/404` | sim | — | ❌ (nunca) |

**Sitemap: 8 URLs.** `trailingSlash: "never"`, sem barra final em nenhuma.

### Regras de slug (FR-015)

- Português, por **termo de busca**, não por código interno. `AER` é a
  linguagem do painel; `/passagens-aereas` é a da consulta que traz a pessoa.
- Minúsculas, hífen como separador, sem acento.
- Um slug por produto, únicos entre si, **e sem colisão com URL viva no hub**.

### Não-colisão com o hub (FR-041) — verificação obrigatória antes do merge

O hub publica **apenas** o 301 de `/viagens` e nenhuma sub-rota. Nenhum dos
quatro slugs colide. Isto é reconferido no `astro.config.mjs` do hub antes do
merge, não assumido: é a única forma de esta feature criar canibalização depois
de entregue. **Uma URL, um domínio.**

## 2. Destinos de saída (links externos)

| De onde | Para onde | Alvo |
|---|---|---|
| Bloco 5 de cada portão ("Ação") | `EXTERNOS.busca` | nova aba (`target="_blank" rel="noopener"`) |
| CTA de estação na capa | `EXTERNOS.busca` | nova aba |
| WhatsApp de ajuda | `whatsapp(...)` | nova aba |
| Consulta SUSEP / Cadastur | `EXTERNOS.susepConsulta`, `EXTERNOS.cadastur` | nova aba |

**Invariante:** existe **uma** URL de busca em todo o site, e ela vive numa
constante só. Verificado por teste (V7).

### O que o clique de busca NÃO faz — e por isso o texto não promete

Medido em 2026-08-28 (ver `research.md` §R1): a plataforma **não aceita link
profundo utilizável**. Selecionar produto não muda a URL, e as rotas de
resultado abertas direto afirmam "nenhum voo foi encontrado" a quem nunca
buscou. Então:

- ✅ "Abrir a busca — nova aba, na plataforma de reservas"
- ✅ "…e escolher **Voos** lá dentro"
- ❌ "Buscar passagens aéreas" (promete filtro que o clique não entrega)
- ❌ qualquer URL de `*-list` ou `combined`

## 3. Navegação interna (mudança de contrato)

As quatro linhas do painel **deixam de ser links externos**:

| | Antes | Depois |
|---|---|---|
| `href` | `EXTERNOS.busca` | `produto.rota` |
| `target` | `_blank` | — (mesma aba) |
| `rel` | `noopener` | — |
| Texto oculto | "abre em nova aba" | "abrir o portão de {produto}" |

O aviso de nova aba migra para o bloco 5 do portão, que é onde o link externo
passa a existir. Anunciar "abre em nova aba" num link que não abre é o
Princípio IV aplicado a leitor de tela.

**Volta ao painel (FR-019):** uma **linha de placa**, não breadcrumb e não botão
"voltar". `href="/"`, presente em todos os quatro portões, na mesma posição.

## 4. `robots.txt` e `llms.txt` (FR-041)

Ambos são endpoints TypeScript com lista à mão. Os quatro portões entram nos
dois. No `llms.txt`, a declaração em maiúsculas sobre ausência de preço passa a
valer explicitamente para as nove rotas — é ela que impede um motor de resposta
de preencher a lacuna da tarifa sozinho.

Continua declarado no `llms.txt`: **o número de Cadastur não está publicado.**
