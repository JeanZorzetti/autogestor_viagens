# Contrato — Dados estruturados dos portões

O outro consumidor deste site é a máquina: buscador e motor de resposta. O
`@graph` de hoje declara `TravelAgency` + `WebSite` + `FAQPage` na capa. Este é
o contrato do que cada portão acrescenta.

## 1. O que NÃO muda

- **Uma organização só**, `["TravelAgency", "Organization"]`, `@id`
  `/#agencia`, com `parentOrganization` apontando para o hub. Portão **não**
  cria segunda organização — dois domínios com o mesmo endereço e telefone sem
  o laço aparecem como empresas diferentes, e é isso que derruba SEO local.
- **`identifier`** continua carregando o registro SUSEP **com a URL da consulta
  pública**. Nenhum portão afirma número de Cadastur (Princípio VI).
- **`FAQPage`** continua saindo da mesma lista que o FAQ visível (FR-033). Se um
  portão ganhar FAQ próprio, a regra vale ali: uma lista, dois usos.

## 2. O que cada portão acrescenta (FR-024, Cenário 10)

Um nó de serviço por portão, referenciando a organização existente:

```
{
  "@type": "Service",
  "@id": "{site}{rota}#servico",
  "serviceType": "<nome do produto>",
  "name": "<título do portão>",
  "description": "<o BLUF, palavra por palavra>",
  "provider":  { "@id": "{site}/#agencia" },
  "areaServed": AREA_SERVIDA,
  "url": "{site}{rota}"
}
```

Mais o `WebPage` do portão, com `isPartOf` do `WebSite` e `about` do serviço.

### Regras

| # | Regra | Por quê |
|---|---|---|
| S1 | `@id` **único** por portão, com fragmento (`#servico`) | dois nós com o mesmo `@id` se fundem e o grafo perde três dos quatro |
| S2 | `provider` é **referência** (`{"@id": …}`), nunca o objeto repetido | Princípio II: uma fonte, e o nó completo mora na capa |
| S3 | `description` é o **mesmo texto** do BLUF visível | texto de schema que não existe na página é o que faz um motor citar frase que o leitor não encontra |
| S4 | **Nenhum `offers`, `price`, `priceRange` ou `priceSpecification`** | Princípio VI e FR-029: preço vive na busca. Um `offers` vazio ou "sob consulta" convida o motor a inventar um número |
| S5 | Nome de terceiro (companhia, rede, locadora) **não** vira nó `Brand` ou `Organization` | FR-021: tipografia, nunca logotipo — e nunca entidade estruturada que sugere parceria declarada |
| S6 | Um `<h1>` único por portão, casando com `name` | Cenário 10 |

## 3. `<title>`, meta e BLUF

| Elemento | Regra |
|---|---|
| `<title>` | próprio por portão. **Nenhum herda o da capa** (FR-024). |
| `meta description` | própria, e diferente do BLUF — a description vende o clique, o BLUF responde a pergunta. |
| Primeiro parágrafo | **BLUF**: responde direto a pergunta que traz a pessoa, antes de qualquer contexto. |
| `canonical` | absoluto, do `site` resolvido em `astro.config.mjs`. `SITE_URL` inválida cai no domínio de produção **com aviso no log** — o build não quebra, mas o canonical fica errado (Princípio IV). |

## 4. O que nenhum portão pode declarar

- Preço, tarifa, "a partir de", faixa de preço — em texto **ou** em schema.
- Hora de voo, número de voo, portão de embarque, status de embarque (FR-030 e
  a seção "o que escala de herói NÃO pode significar").
- Registro, licença ou credencial **sem** o caminho de verificação junto
  (FR-031).
- Cobertura dos seis produtos da plataforma. Este site cobre **quatro**;
  `Exclusivos` e `Seguros` são do outro lado, e seguro viagem é assunto da
  corretora, com site próprio (`research.md` §R1).
