<!--
SYNC IMPACT REPORT
==================
Versão: 1.0.0 → 1.0.1
Tipo de bump: PATCH — correção de fato no Sync Impact Report, sem tocar em
princípio, seção ou regra de governança. A ratificação 1.0.0 afirmava que
`specs/001-painel-e-portoes` estava "implementada e verificada" e que o portão de
conformidade só valeria da próxima `/speckit-plan` em diante. As duas metades são
falsas, e foi verificado no repositório em 2026-08-28: nenhuma das quatro rotas
existe, e o `plan.md` já traz a seção "Constitution Check". Esta emenda existe
porque uma constituição que erra sobre o estado do repositório é pior que uma sem
a nota: enquanto a linha estivesse escrita, ela isentava a feature do gate — que é
exatamente o tipo de afirmação sem lastro que o Princípio IV proíbe as telas de
fazer — e nenhum Constitution Check deste repo teria autoridade. Nada passa a ser
permitido em consequência; o que muda é que o portão vale desta feature em diante,
e ela já o cumpriu.

Histórico:
  1.0.0 — MAJOR, ratificação inicial. O arquivo anterior era o scaffold do Spec
  Kit com todos os placeholders intactos; nenhum princípio existia para ser
  alterado ou removido.

Princípios adicionados (6):
  I.   HTML estático primeiro — aqui, zero JavaScript
  II.  Fonte única por domínio
  III. Simplicidade deliberada e marcada
  IV.  Falhar fechado, nunca mentir para o usuário
  V.   Acessibilidade e contraste são requisito medido
  VI.  Número não se inventa; alegação vem com caminho de verificação

Seções adicionadas:
  - Restrições de Stack, Conteúdo e Direção   (SECTION_2)
  - Fluxo de Desenvolvimento e Portões de Qualidade   (SECTION_3)
  - Governança

Herança e desvios em relação aos repositórios irmãos (`autogestor`, `coopluz`,
`seguros`): os princípios I a V são a mesma família, adaptados ao que este
repositório de fato é. Os três desvios que importam:
  - I é MAIS restrito: lá o orçamento é "~1 KB e rota dinâmica justificada por
    escrito"; aqui é ZERO kb e ZERO rota dinâmica, porque a vertical é
    self-service e não capta lead.
  - IV perde a metade sobre banco, sessão e gravação: não há `pg`, não há
    `DATABASE_URL`, não há `/api/lead`, não há painel. Ganha a metade sobre
    build e canonical, que é onde este site pode mentir.
  - VI é próprio desta vertical. O irmão `coopluz`/`seguros` tem um VI sobre
    identidade de terceiro; aqui o risco equivalente é preço e registro —
    afirmar tarifa sem consulta ou registro sem número de consulta pública.

Artefatos dependentes revisados:
  ✅ README.md — corrigido o número de pares de contraste (dizia 23 em um
     ponto e 37 em outro; o medido é 37).
  ✅ .specify/templates/plan-template.md — a seção "Constitution Check" é
     genérica ("[Gates determined based on constitution file]") e a
     "Complexity Tracking" já pede alternativa recusada; nada a mudar.
  ✅ .specify/templates/spec-template.md — sem seção obrigatória adicionada ou
     removida por esta constituição.
  ✅ .specify/templates/tasks-template.md — categorias de tarefa continuam
     válidas; nenhum tipo novo dirigido por princípio.
  ✅ .claude/skills/speckit-*/SKILL.md — sem referência a agente específico que
     precise virar orientação genérica.
  ✅ specs/001-painel-e-portoes/spec.md — escrita em 2026-08-27, antes desta
     ratificação. A spec em si não tem seção "Constitution Check", mas o
     `plan.md` de 2026-08-28 avaliou os seis princípios antes da Phase 0 e
     depois da Phase 1, com veredito de passagem sem violação. A feature **não
     está implementada**: nenhuma das quatro rotas existe. O portão vale desta
     feature em diante, e ela já o cumpriu.

Nenhum TODO deferido; nenhum placeholder mantido.
-->

# Autogestor Viagens Constitution

Aplica-se a este repositório: o site Astro em `viagens.roilabs.com.br`, operado
pelo Grupo Autogestor. Não há aqui banco, endpoint, sessão ou painel — o painel
que existe é o do hub `autogestor` e mora naquele repositório. Esta é a única
das frentes da casa que é self-service: a compra acontece inteira na busca da
plataforma de reservas, e este site existe para produzir um clique nela.

## Core Principles

### I. HTML estático primeiro — aqui, zero JavaScript

O site MUST ser gerado como HTML estático. Cada página MUST funcionar por
completo sem JavaScript no cliente, e neste repositório a regra é mais dura que
nos irmãos: o orçamento de JavaScript de runtime é **0 kb**, e o de dependência
de runtime é **zero pacote**. Não há rota dinâmica, função serverless nem cold
start, e não deve passar a haver por conveniência.

Coreografia, estado visual e resposta a scroll MUST ser CSS. Sem JavaScript, sem
suporte a `scroll-timeline` ou sob `prefers-reduced-motion`, a página MUST ser
a mesma página: nasce inteira, parada, com o conteúdo visível — nunca vazia
esperando script.

Qualquer JavaScript novo enviado ao cliente MUST vir com seu custo em bytes
medido e declarado no PR, e MUST nomear a capacidade que CSS não tem. Se a
vertical um dia passar a captar lead, o caminho MUST ser copiar o endpoint do
repositório `seguros` — não inventar um segundo desenho para o mesmo problema.

**Rationale**: HTML pronto no source é o que o crawler indexa e é o que dá o
LCP de 0,32s medido. O zero aqui não é purismo: é a consequência de a página não
ter nenhuma interação que precise de servidor. Manter o zero é barato; recuperá-lo
depois de perdido, não.

### II. Fonte única por domínio

Cada domínio de dado MUST ter exatamente um arquivo dono: NAP, telefone, nome do
site e links externos em `src/consts.ts`; destinos, produtos e textos de placa em
`src/data/conteudo.ts`; cor, tipo e espaçamento em `src/styles/tokens.css`; a
geometria da marca em `src/components/Logo.astro`. Página, rodapé, JSON-LD e
`llms.txt` MUST ler do dono, nunca repetir o valor.

O endereço da busca da plataforma de reservas MUST viver numa constante só, e
todo CTA MUST apontar para ela. Há teste que falha se um CTA divergir.

Duplicação com o repositório do hub é permitida SOMENTE porque os dois builds
não devem se acoplar — decisão do hub: nenhum import atravessando a fronteira.
Nesse caso o arquivo duplicado MUST carregar, no topo, o comentário que diz de
onde veio, por que não importa o original, e o que dispara a atualização.
`src/consts.ts` e a geometria de `Logo.astro` são os exemplos canônicos: ao
mudar NAP, telefone, fundação ou horário no hub, replicar aqui à mão.

A marca MUST continuar sendo a mesma marca da casa, copiada do hub e não
redesenhada. Redesenhar aqui cria uma segunda versão para divergir em silêncio.

**Rationale**: NAP divergente entre rodapé, JSON-LD e página de contato é o erro
clássico que derruba SEO local. Um CTA apontando para uma URL antiga é um clique
perdido que nenhum teste de build pega sozinho.

### III. Simplicidade deliberada e marcada

Antes de somar uma dependência para algo pequeno — parsing, formatação, medição,
animação — o autor MUST verificar se a plataforma ou o padrão do repo já resolve
aquilo em poucas linhas. Dependência nova MUST vir com a alternativa mais simples
nomeada e o motivo da recusa escrito. Dependência de **runtime** nova MUST, além
disso, ser aprovada explicitamente pelo dono do projeto: ela quebra o Princípio I.

Toda simplificação deliberada MUST ser marcada com um comentário `ponytail:` que
nomeia **o teto conhecido** e **o caminho de saída**. Comentário `ponytail:` sem
teto e sem saída não é documentação, é desculpa.

Abstração especulativa é proibida: nada de componente com um uso, camada de dados
para quatro páginas, ou configuração para um valor que não muda. Quando crescer,
quem crescer escreve.

**Rationale**: o repo inteiro é pequeno de propósito — quatro páginas, uma fonte,
nenhum runtime. Cada peça que entra precisa pagar a própria passagem, e o que
mantém isso honesto é o teto escrito ao lado do atalho.

### IV. Falhar fechado, nunca mentir para o usuário

Sem a configuração de que depende, o código MUST recusar ou avisar em vez de
fingir. `SITE_URL` inválida MUST ser detectada no build (`URL.canParse`), MUST
gerar aviso no log e MUST cair no domínio de produção — o build não quebra, mas o
canonical fica errado, e conferir a variável continua sendo obrigação de quem
publica. Antes de investigar qualquer falha de deploy, as variáveis de ambiente
MUST ser lidas e conferidas primeiro.

Nenhuma tela MUST afirmar um estado que não ocorreu, e nenhum texto MUST prometer
o que este site não faz: aqui não há envio, não há confirmação e não há "pedido
recebido" — há um clique que sai para a plataforma de reservas, e a página MUST
dizer que sai (nova aba, plataforma de terceiro) antes de o usuário clicar.

Segredos MUST ser lidos de `process.env` e NUNCA commitados.

**Rationale**: um site estático não tem gravação para falhar, então o lugar onde
ele pode mentir é outro: prometendo atendimento que não existe, ou publicando um
canonical apontando para um domínio que não é o dele.

### V. Acessibilidade e contraste são requisito medido

Contraste de texto MUST passar em WCAG AA (4.5:1 para texto normal, 3:1 para
texto grande e para limite de componente interativo — WCAG 1.4.11). Quando a cor
da marca reprova, MUST-se trocar o texto ou o valor do token, não abandonar o
contraste.

Todo par de cor novo MUST passar por `npm run contraste` **antes** de entrar no
CSS, e o valor medido MUST ficar escrito ao lado da declaração. O checador MUST
continuar lendo `tokens.css` e resolvendo `var()` e OKLCH na hora: uma cópia da
paleta em hex dentro do script cria uma segunda fonte da verdade e é proibida
pelo Princípio II. Estimativa não conta — o número que vale é o que a ferramenta
devolveu.

Estado e status NUNCA MUST ser comunicados só por cor. Todo controle interativo
MUST ser operável por teclado, com foco visível (`:focus-visible`, jamais
`outline: none` sem substituto); onde um anel de foco herdado sumiria sobre o
próprio botão, o componente MUST trocar `--foco` pela cor que contrasta.
Elemento nativo MUST ser preferido a réplica em JavaScript — e sob o Princípio I,
réplica em JavaScript simplesmente não é opção.

Animação MUST respeitar `prefers-reduced-motion`. Efeito de ponteiro MUST ser
desligado em `hover: none`. Componente interativo novo MUST passar pela skill
`accessibility` antes do merge; tela nova ou alterada MUST passar pela
`ui-verification` com evidência antes de ser declarada pronta.

**Rationale**: é a categoria de defeito que não aparece em teste de unidade, não é
reportada por quem é afetado, e custa dez vezes mais para consertar depois que a
tela existe. O checador já pegou um: a borda do botão de contorno dava 2.32:1
sobre a placa, e é por isso que `--noite-600` está em `L 0.505` — é contraste,
não gosto.

### VI. Número não se inventa; alegação vem com caminho de verificação

Este site NUNCA MUST publicar preço de passagem, pacote ou diária. Tarifa muda
por rota, por data e por hora, e o único valor válido é o da busca no momento da
compra; um número na página seria número inventado. A ausência de preço MUST
estar declarada onde o usuário e onde um motor de resposta a encontrem — primeira
tela, `/sobre`, Termos, rodapé e `llms.txt`. Há teste que falha se um `R$`
aparecer no conteúdo servido, e ele MUST continuar existindo.

Registro, licença ou credencial MUST ser afirmado SOMENTE com o identificador e a
URL da consulta pública junto. Registro sem número de verificação MUST NOT ser
afirmado — e quando um registro esperado não está publicado, o `llms.txt` MUST
dizer explicitamente que ele não está, para o modelo não deduzir um.

Marca de terceiro MUST aparecer em tipografia, NUNCA como logotipo, enquanto não
houver ativo licenciado neste repositório.

**Rationale**: o Princípio IV proíbe a tela afirmar o que não ocorreu; este
estende a proibição para o que ninguém consegue checar. Alegação com caminho de
verificação é o que um motor de resposta cita; número solto ele também cita — e
aí o erro é nosso, publicado em nome da empresa. É a mesma decisão que o
`coopluz` tomou com os logos de emissora e o `seguros` com os das seguradoras.

## Restrições de Stack, Conteúdo e Direção

**Um repositório, nenhum banco.** Este site é um build independente, com
`package.json`, `npm test` e projeto Vercel próprios. Ele não compartilha
processo, pacote nem banco com o hub — compartilha apenas conteúdo replicado à
mão sob o Princípio II. Nenhum monorepo, nenhum import atravessando a fronteira.

**Uma URL, um domínio.** Nenhum conteúdo deste site MUST ser publicado também no
hub, e vice-versa. Migrar uma vertical tem duas metades: a página SAI da origem e
a origem responde **301** — `canonical` cruzada não basta, porque mantém as duas
servindo 200. Publicar só a metade de cá recria a canibalização que a spec 003 do
`coopluz` existiu para matar.

**Direção: a placa de embarque.** O verbo da página é **virar**, não desbotar:
uma pá gira no eixo horizontal e trava num valor novo. Não MUST haver fade em
nenhuma camada. O gesto MUST permanecer o mesmo nas quatro camadas (entrada,
scroll, ponteiro, transição de rota) — inventar um segundo gesto dilui o único
que a página tem.

O elemento de LCP (`H1.placa__titulo`) MUST NOT ser animado: o resto chega em
volta dele. A pá que gira sozinha MUST mostrar destino, NUNCA preço
(Princípio VI). O ciclo da placa MUST NOT deixar a janela vazia — a saída de uma
pá se sobrepõe à entrada da próxima, de propósito, e `test/placa.test.mjs` falha
se alguém "consertar" isso.

**Macroestrutura: índice, não pilha de seções.** Enquanto o site tiver este
tamanho, o conteúdo é lista: linha de placa com código à esquerda e status à
direita, a linha inteira sendo o link. **Zero cards.** Páginas internas
(`/sobre`, `/privacidade`, `/termos`) MUST usar o documento simples (`.doc`) e
MUST NOT encenar a placa — encenar um percurso que o conteúdo não tem é pior que
não encenar nenhum.

**Tipografia como material.** A monoespaçada manda no display, nos códigos e nas
linhas da placa; o texto corrido MUST rodar na pilha do sistema (0 kb baixados).
O orçamento de fonte é **um arquivo**.

**Estilo.** CSS puro com custom properties, em `tokens.css` como fonte única.
Este site tem uma banda só (escura) — não há `light-dark()` a manter, e
introduzir tema claro é decisão de produto, não refatoração.

**Dados estruturados.** A organização no JSON-LD MUST ser `TravelAgency`, não
`Organization` genérica, e MUST manter `parentOrganization` apontando para o hub
— dois domínios com o mesmo endereço e telefone sem esse laço aparecem como
empresas diferentes, que é o que derruba SEO local.

**Idioma.** Texto de interface, nomes de variável, nomes de prop e comentários de
código MUST estar em português. Mensagens de commit MUST estar em inglês. Ao
editar um arquivo, seguir o padrão dele.

## Fluxo de Desenvolvimento e Portões de Qualidade

**Feature não-trivial segue Spec Kit.** `speckit-specify` → `speckit-clarify` →
`speckit-plan` → `speckit-tasks` → `speckit-implement`, validando com
`speckit-analyze` / `speckit-checklist`. Correção pontual e ajuste de conteúdo não
precisam do fluxo.

**Lógica testável mora em `.mjs`.** Toda lógica pura não-trivial — cálculo de
ciclo, parsing de CSS, medição — MUST ficar em um `.mjs` que `node --test`
importe direto, sem transpilar. `test/placa.test.mjs` e `logos/contraste.mjs` são
o padrão.

**Todo caminho não-trivial deixa um teste.** Ramo, laço, parser ou invariante de
conteúdo MUST deixar ao menos uma checagem executável — a menor coisa que falha
se a regra quebrar. Sem framework, sem fixture, sem suíte por função. One-liner
trivial não precisa de teste. As invariantes já cobertas (ciclo da placa,
sobreposição das pás, ausência de `R$`, CTA único) MUST NOT ser removidas sem
emenda a esta constituição.

**Ativo derivado é gerado, nunca desenhado.** Favicon e imagem de compartilhamento
MUST sair de script (`node logos/gerar-og.mjs`), de uma fonte só. Arquivo mantido
à mão desatualiza em silêncio.

**Portão de conclusão.** Antes de declarar qualquer trabalho pronto, o autor MUST
rodar o comando de verificação e MUST ter visto a saída: `npm test`,
`npm run check`, `npm run build` e, quando a paleta mudar, `npm run contraste`.
Mexeu em tela: `npm run verificar`. Afirmação de sucesso sem evidência é violação
desta constituição. Se um teste falha, o relato MUST dizer isso, com a saída.

**Verificação de tela é sobre o BUILD.** O `astro dev` injeta a barra de
ferramentas do Astro — DOM extra e ~1,8 MB de JavaScript que não existem em
produção. Medir ali é medir outra página. `logos/verificar.mjs` serve
`.vercel/output/static` justamente por isso, e falha com código 1 se o orçamento
de CWV estourar. O orçamento MUST viver na constante `ORCAMENTO` do script, não
espalhado em documento.

**Decisão não óbvia vira documentação.** Escolha de UI, contraste, direção ou
arquitetura cuja razão não é legível no código MUST ser registrada no `README.md`,
com o número que sustenta a decisão quando houver. Alternativa construída e
**recusada** MUST ser registrada junto — a "emenda" verde sob o botão é o
exemplo: está escrita para ninguém reinventá-la achando que é melhoria.

**Harness de UX/UI.** As skills especialistas em `~/.claude/skills/` MUST ser
invocadas assim que a tarefa tocar a disciplina, antes de escrever código ou texto
de interface. Pedido que atravessa mais de uma disciplina MUST passar por
`design-review`, que ordena e consolida.

## Governança

Esta constituição prevalece sobre qualquer outra prática do repositório. Em
conflito entre ela e um hábito, uma sugestão de ferramenta ou um padrão herdado de
repositório irmão, ela vence — exceto diante de instrução explícita do dono do
projeto, que prevalece sobre tudo e MUST ser registrada como emenda se for para
valer daí em diante.

**Emendas.** Toda emenda MUST ser feita por `/speckit-constitution`, MUST declarar
o que muda e por quê no Sync Impact Report no topo do arquivo, e MUST listar os
artefatos dependentes a revisar. Emenda que remove ou redefine um princípio MUST
nomear o que passa a ser permitido em consequência.

**Versionamento.** Semântico, sobre o conteúdo desta constituição:

- **MAJOR** — remoção ou redefinição incompatível de princípio ou de regra de
  governança.
- **MINOR** — princípio ou seção nova, ou orientação materialmente expandida.
- **PATCH** — esclarecimento, redação, correção sem mudança de sentido.

**Conformidade.** A seção "Constitution Check" de todo `plan.md` MUST avaliar a
feature contra os seis princípios, antes da Phase 0 e de novo depois da Phase 1.
Violação MUST ser registrada na tabela "Complexity Tracking" com o motivo e a
alternativa mais simples recusada — complexidade não justificada por escrito é
reprovação, não observação. `/speckit-analyze` MUST ser executado antes de
`/speckit-implement` em features que adicionem JavaScript de runtime, rota
dinâmica ou dependência nova, e em qualquer feature que toque conteúdo de preço,
registro ou marca de terceiro.

**Orientação de runtime.** Para o dia a dia, o `README.md` carrega os comandos, as
pegadinhas de ambiente e as decisões já tomadas. Esta constituição diz o que não
se negocia; o README diz como o trabalho é feito.

**Version**: 1.0.1 | **Ratified**: 2026-08-28 | **Last Amended**: 2026-08-28
