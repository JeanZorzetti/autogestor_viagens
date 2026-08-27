import { EMPRESA, EXTERNOS } from "../consts";

/** Toda a placa em um lugar só.
 *
 *  REGRA QUE MANDA NESTE ARQUIVO: nenhum valor aqui é inventado. A direção de
 *  arte é uma placa de embarque, e placa de embarque mostra preço e horário —
 *  o que este site NÃO tem, porque a tarifa vive na busca da OnerTravel e muda
 *  por rota e por data. Então a placa mostra o que é verdade sem consultar
 *  nada: os quatro produtos, onde eles valem, e o parcelamento máximo. Um
 *  "R$ 1.284" de enfeite na primeira tela seria número inventado — o defeito
 *  que a direção do site de seguro recusou por escrito quando descartou a
 *  proposta "Brasa". */

/** As quatro linhas da placa. São o índice da página e o CTA ao mesmo tempo:
 *  a linha inteira é o link, não um botão dentro dela. */
export const PRODUTOS = [
  {
    codigo: "AER",
    nome: "Passagens aéreas",
    onde: "Brasil e exterior",
    nota: "Companhias lado a lado na mesma busca",
    /** Conteúdo interno do <svg viewBox="0 0 24 24">, traço em currentColor. */
    icone:
      '<path d="M10.2 3.6a1.8 1.8 0 0 1 3.6 0V9l7.7 4.3v2.3l-7.7-2.2v4.3l2.6 1.9v1.8L12 20.3l-4.4 1.1v-1.8l2.6-1.9v-4.3L2.5 15.6v-2.3L10.2 9z"/>',
  },
  {
    codigo: "HTL",
    nome: "Hotéis e resorts",
    onde: "Brasil e exterior",
    nota: "Filtra por categoria de quarto e regime",
    icone:
      '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 10h4a1 1 0 0 1 1 1v10"/><path d="M7.5 8h1M7.5 12h1M7.5 16h1M11.5 8h1M11.5 12h1M11.5 16h1"/><path d="M2.5 21h19"/>',
  },
  {
    codigo: "PCT",
    nome: "Pacotes",
    onde: "Voo + hospedagem",
    nota: "Os dois no mesmo preço e no mesmo carrinho",
    icone:
      '<rect x="3.5" y="8" width="17" height="12" rx="2"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8"/><path d="M9.5 12v4M14.5 12v4"/>',
  },
  {
    codigo: "CAR",
    nome: "Aluguel de carro",
    onde: "Retirada no destino",
    nota: "Inclusive no aeroporto de chegada",
    icone:
      '<path d="M3 16.5v-3.2l1.8-4.4A2 2 0 0 1 6.65 7.6h10.7a2 2 0 0 1 1.85 1.3L21 13.3v3.2"/><path d="M3 16.5h18"/><circle cx="7.2" cy="16.5" r="1.9"/><circle cx="16.8" cy="16.5" r="1.9"/><path d="M4.8 13.3h14.4"/>',
  },
] as const;

/** A pá que gira sozinha na primeira tela — o motor autônomo da direção.
 *
 *  São destinos que a busca vende, não preços: um nome de cidade é fato, uma
 *  tarifa sem consulta seria invenção. Ordem alternando Brasil e exterior de
 *  propósito, para a pá provar as duas abrangências enquanto vira. */
export const DESTINOS = [
  "FORTALEZA",
  "LISBOA",
  "PORTO SEGURO",
  "BUENOS AIRES",
  "MACEIÓ",
  "ORLANDO",
  "GRAMADO",
  "SANTIAGO",
] as const;

/** Onde a comparação acontece de verdade. Nomes em tipografia, NUNCA logotipo:
 *  CVC, Booking, Decolar e Hotéis.com são marcas registradas de terceiros e
 *  não há ativo licenciado neste repositório. Mesma decisão que o coopluz
 *  tomou com os logos de emissora e o seguros com os das seguradoras. */
export const CONCORRENTES = ["CVC", "Booking", "Decolar", "Hotéis.com"] as const;

/** As três razões da estação 01. Lista densa numerada, não card com ícone. */
export const RAZOES = [
  {
    titulo: "Promoção nova todo dia",
    texto:
      "Passagem e hotel entram e saem de promoção diariamente, por rota e por data. Quem compara no dia da compra paga menos que quem decidiu na semana passada — e a diferença não é constante, por isso não adianta memorizar quem é o mais barato.",
  },
  {
    titulo: "Tarifa que o balcão público não mostra",
    texto:
      "A busca roda com inventário de consolidador e acordos de agência. Em voo internacional, em data longa e em grupo é onde a diferença costuma aparecer; em trecho nacional curto, muitas vezes não aparece — e aí você compra onde estiver mais barato.",
  },
  {
    titulo: "O parcelamento entra na conta",
    texto:
      "Nem sempre a passagem mais barata é a que cabe no mês. Até 12x no cartão muda qual opção é realmente a melhor, e isso só fica visível quando você compara o total parcelado em vez do valor à vista.",
  },
] as const;

/** Os três passos. Também linha de placa, com número no lugar do código. */
export const PASSOS = [
  {
    titulo: "Diga para onde e quando",
    texto:
      "Origem, destino, datas e quantas pessoas. A busca volta com voos, hotéis, pacotes e carros disponíveis, com o preço final já na tela — sem cadastro para ver valor.",
  },
  {
    titulo: "Compare e monte o carrinho",
    texto:
      "Filtre por horário, escala, categoria de quarto ou companhia. Dá para juntar voo e hospedagem no mesmo carrinho e mandar o link para quem vai junto decidir com você, antes de qualquer pagamento.",
  },
  {
    titulo: "Pague em até 12x e receba o bilhete",
    texto:
      "Cartão de crédito, pagamento criptografado e emissão automática. O bilhete e o voucher chegam no seu e-mail em seguida, sem depender de alguém confirmar do outro lado.",
  },
] as const;

export const PERGUNTAS = [
  {
    p: "Por que comprar aqui e não direto no site da companhia aérea?",
    r: "Porque numa busca só você vê as companhias lado a lado, com as tarifas de agência que nem sempre aparecem no balcão público, e parcela em até 12x mesmo quando a companhia oferece menos. Se o site dela estiver mais barato, compre lá — a busca existe justamente para você conferir isso em segundos.",
  },
  {
    p: `As tarifas batem com as da ${CONCORRENTES.join(", ")}?`,
    r: "Nem sempre, e é exatamente por isso que vale abrir os dois. As promoções entram todo dia e mudam por rota e por data: a mesma viagem pode sair mais barata aqui numa semana e mais cara na outra. Pesquise onde quiser e compare aqui antes de fechar — leva menos de um minuto.",
  },
  {
    p: "Dá para parcelar em até 12x mesmo?",
    r: "Sim, no cartão de crédito, em passagem, hotel, pacote e aluguel de carro. Quantas dessas parcelas saem sem juros depende da tarifa e da operadora, e o número exato aparece na tela de pagamento antes de você confirmar a compra.",
  },
  {
    p: "É seguro comprar sozinho, sem falar com ninguém?",
    r: `A emissão sai pelo mesmo sistema de reservas que as agências usam, o pagamento passa por gateway com dados de cartão criptografados e o bilhete cai no seu e-mail na hora. Se algo travar no meio da compra, o WhatsApp ${EMPRESA.telefoneExibicao} responde — não é obrigatório usar, é a rede de segurança de quem prefere.`,
  },
  {
    p: "Dá para decidir junto com quem vai viajar?",
    r: "Dá. A busca deixa você montar o carrinho — voo, quarto, datas, número de pessoas — e compartilhar o link com quem vai junto antes de qualquer pagamento. Cada um abre, vê o mesmo preço e a mesma reserva, e só depois alguém fecha.",
  },
  {
    p: "E se o voo atrasar ou for cancelado depois que eu comprei?",
    r: `Remarcação e reacomodação seguem a regra da companhia aérea, e o canal direto dela costuma ser o caminho mais rápido. Quando o atendimento automático não resolve, chame o ${EMPRESA.telefoneExibicao}: a gente localiza a regra da sua tarifa e aciona a operadora por você.`,
  },
  {
    p: "Vendem seguro viagem?",
    r: `Sim. Como o grupo é corretora registrada na SUSEP sob o número ${EMPRESA.susep}, o seguro viagem sai com a mesma análise que fazemos em seguro de veículo — cobertura médica, bagagem e cancelamento comparadas antes da compra, e não empurradas no checkout. O registro pode ser conferido na consulta pública da SUSEP.`,
    /** Alegação com caminho de verificação é o que motor de resposta cita;
     *  número solto, não. */
    fonte: { texto: "Consultar o registro na SUSEP", href: EXTERNOS.susepConsulta },
  },
  {
    p: "Quem emite a reserva? Vocês ou outra empresa?",
    r: "A busca e a emissão rodam na plataforma da OnerTravel, operada sob a marca Autogestor Viagens. Você vai perceber a troca: o site da busca tem outro visual, e isso é esperado — é a mesma compra, no ambiente de reservas. O contrato de transporte e de hospedagem é sempre com a companhia aérea, a rede hoteleira ou a locadora escolhida.",
  },
] as const;

/** areaServed do JSON-LD. O Brasil inteiro: diferente das duas frentes da
 *  Coopluz, esta vertical não é restrita a área de concessionária nenhuma. */
export const AREA_SERVIDA = { "@type": "Country", name: "Brasil" } as const;
