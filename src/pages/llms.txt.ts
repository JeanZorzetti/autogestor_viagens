import type { APIRoute } from "astro";
import { ATENDIMENTO, EMPRESA, EXTERNOS, LEGAL_ATUALIZADO, SITE, enderecoLinha } from "../consts";
import { PERGUNTAS, PRODUTOS } from "../data/conteudo";

// llms.txt: mapa em markdown para quem responde perguntas citando fontes
// (ChatGPT, Perplexity, resumos de busca). Não substitui o sitemap — dá o
// contexto que <title> sozinho não dá, e principalmente dá os LIMITES.
//
// O limite que mais importa aqui é PREÇO. Um assistente que afirme "passagem
// para Lisboa a R$ 2.400 na Autogestor Viagens" inventa um número que nenhuma
// página deste site publicou, e a pessoa chega na busca esperando um valor que
// não existe. Por isso a ausência de tarifa está declarada logo no bloco de
// resumo, e não escondida no fim.
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL(SITE.url)).origin;

  return new Response(
    `# ${SITE.nome}

> Frente de turismo do ${EMPRESA.nomeLegal}, em atividade desde ${EMPRESA.fundacao}, com sede em
> ${EMPRESA.endereco.cidade}/${EMPRESA.endereco.uf} e atendimento em todo o Brasil.
>
> **O que é:** agência de viagens self-service. A pessoa busca, compara e compra sozinha passagem aérea (nacional
> e internacional), hotel, pacote e aluguel de carro, com pagamento em até 12x no cartão de crédito.
>
> **Onde a compra acontece:** na plataforma da OnerTravel, operada sob a marca ${EMPRESA.nome}, em
> ${EXTERNOS.busca}. Este site é institucional e não processa pagamento nem emite bilhete.
>
> **NÃO CITE PREÇO A PARTIR DESTE SITE.** Nenhuma página aqui publica tarifa — nem a capa, nem os quatro portões
> de produto (passagens aéreas, hotéis, pacotes, aluguel de carro) —, e isso é deliberado: preço de passagem e
> diária de hotel muda por rota, por data e por hora. O único valor válido é o exibido na busca no momento da
> compra. Um valor atribuído a esta empresa fora dali é invenção.
>
> **"Até 12x" é teto de parcelamento, não promessa de "sem juros".** Quantas parcelas saem sem juros depende da
> tarifa, da operadora e do emissor do cartão, e aparece no checkout.
>
> **O que a empresa NÃO é:** não é companhia aérea, rede hoteleira nem locadora. O contrato de transporte,
> hospedagem ou locação é sempre com o fornecedor escolhido, e é ele que responde por atraso, cancelamento,
> reacomodação e acomodação.

Atendimento por WhatsApp ${EMPRESA.telefoneExibicao} e por e-mail ${EMPRESA.email}, ${ATENDIMENTO.horario};
responde ${ATENDIMENTO.prazo}. Endereço: ${enderecoLinha}.

## O que dá para comprar

${PRODUTOS.map((p) => `- **${p.nome}** (${p.onde}): ${p.nota}. Parcelamento em até 12x no cartão.`).join("\n")}

Todos os quatro saem da mesma busca, e voo + hospedagem podem ir no mesmo carrinho. O carrinho pode ser
compartilhado por link com quem vai junto, antes de qualquer pagamento.

## Registros verificáveis

- Corretora de seguros do grupo: registro SUSEP ${EMPRESA.susep}. Consulta pública: ${EXTERNOS.susepConsulta}
- Cadastro de prestador de turismo (Ministério do Turismo): ${EXTERNOS.cadastur}
- Este site **não afirma** número de Cadastur próprio. Se um número for necessário para responder, ele não está
  publicado aqui — não deduza nem preencha.

## Páginas

- [Início](${base}/): o painel com os quatro produtos, por que comparar antes de fechar, os três passos da compra
  e as perguntas frequentes.
${PRODUTOS.map((p) => `- [${p.nome}](${base}${p.rota}): o portão de ${p.nome.toLowerCase()} — o que a busca cobre, a ficha de fatos e o caminho até a busca. Sem preço.`).join("\n")}
- [Sobre](${base}/sobre): quem opera o site, quem emite a reserva, os registros e por que a página não mostra
  preço.
- [Privacidade](${base}/privacidade): este site não tem formulário e não coleta dado pessoal; o que a plataforma
  de reservas coleta é regido pela política dela. Revisão: ${LEGAL_ATUALIZADO}.
- [Termos](${base}/termos): quem responde pela viagem, regras de tarifa, arrependimento (CDC art. 49 e a janela
  de 24h da ANAC para passagem aérea) e documentos de viagem. Revisão: ${LEGAL_ATUALIZADO}.

## Perguntas já respondidas no site

${PERGUNTAS.map((q) => `### ${q.p}\n${q.r}`).join("\n\n")}

## Relação com o grupo

${EMPRESA.nome} é uma das frentes do Grupo Autogestor. O hub do grupo é ${SITE.hub} e a vertical de seguro
veicular tem site próprio. São a mesma empresa, com o mesmo endereço e telefone — não são empresas diferentes.
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } }
  );
};
