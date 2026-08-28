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

/** Qual objeto a cabeça do portão amplia, e o tipo do bloco 3 ("detalhe
 *  ampliado"). Os dois são INJETORES — quatro produtos, quatro valores
 *  distintos em cada campo (FR-020, invariante V1). Um valor repetido
 *  significa dois portões com o mesmo desenho, e a spec inteira reprova. */
type ObjetoDeCabeca = "par" | "faixa" | "duasMetades" | "campoUnico";
type TipoDeDetalhe = "comparacao" | "estados" | "duasColunas" | "grade";

interface Produto {
  codigo: "AER" | "HTL" | "PCT" | "CAR";
  nome: string;
  onde: string;
  nota: string;
  /** Conteúdo interno do <svg viewBox="0 0 24 24">, traço em currentColor. */
  icone: string;
  /** Slug do portão. Português, por termo de busca — é a linguagem da
   *  consulta que traz a pessoa, não a do código de três letras. */
  rota: string;
  /** A lista da coluna que vira: painel e cabeça de portão leem a MESMA
   *  lista (FR-032, uma fonte, dois usos). Comprimentos coprimos entre si
   *  (data-model.md §2) — é o que faz a combinação visível não se repetir
   *  antes de ~1h52 de página aberta. */
  destinos: readonly string[];
  objeto: ObjetoDeCabeca;
  detalhe: TipoDeDetalhe;
}

/** As quatro linhas da placa. São o índice da página e o CTA ao mesmo tempo:
 *  a linha inteira é o link, não um botão dentro dela. */
export const PRODUTOS: readonly Produto[] = [
  {
    codigo: "AER",
    nome: "Passagens aéreas",
    onde: "Brasil e exterior",
    nota: "Companhias lado a lado na mesma busca",
    icone:
      '<path d="M10.2 3.6a1.8 1.8 0 0 1 3.6 0V9l7.7 4.3v2.3l-7.7-2.2v4.3l2.6 1.9v1.8L12 20.3l-4.4 1.1v-1.8l2.6-1.9v-4.3L2.5 15.6v-2.3L10.2 9z"/>',
    rota: "/passagens-aereas",
    // 11 nomes — ciclo 24,2s. R2 (2026-08-28): país/região, nunca cidade —
    // "a busca vende a Argentina" é fato do produto; "a busca vende Buenos
    // Aires" é afirmação sobre o inventário de um terceiro.
    destinos: [
      "BRASIL",
      "ARGENTINA",
      "CHILE",
      "PORTUGAL",
      "ESPANHA",
      "URUGUAI",
      "PARAGUAI",
      "COLÔMBIA",
      "PERU",
      "MÉXICO",
      "ITÁLIA",
    ],
    objeto: "par",
    detalhe: "comparacao",
  },
  {
    codigo: "HTL",
    nome: "Hotéis e resorts",
    onde: "Brasil e exterior",
    nota: "Filtra por categoria de quarto e regime",
    icone:
      '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 10h4a1 1 0 0 1 1 1v10"/><path d="M7.5 8h1M7.5 12h1M7.5 16h1M11.5 8h1M11.5 12h1M11.5 16h1"/><path d="M2.5 21h19"/>',
    rota: "/hoteis",
    // 8 nomes — ciclo 17,6s.
    destinos: ["NORDESTE", "SUDESTE", "SUL", "CENTRO-OESTE", "NORTE", "CARIBE", "EUROPA", "PATAGÔNIA"],
    objeto: "faixa",
    detalhe: "estados",
  },
  {
    codigo: "PCT",
    nome: "Pacotes",
    onde: "Voo + hospedagem",
    nota: "Os dois no mesmo preço e no mesmo carrinho",
    icone:
      '<rect x="3.5" y="8" width="17" height="12" rx="2"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8"/><path d="M9.5 12v4M14.5 12v4"/>',
    rota: "/pacotes",
    // 7 nomes — ciclo 15,4s.
    destinos: ["NORDESTE", "CARIBE", "ARGENTINA", "CHILE", "PORTUGAL", "SUL", "SUDESTE"],
    objeto: "duasMetades",
    detalhe: "duasColunas",
  },
  {
    codigo: "CAR",
    nome: "Aluguel de carro",
    onde: "Retirada no destino",
    nota: "Inclusive no aeroporto de chegada",
    icone:
      '<path d="M3 16.5v-3.2l1.8-4.4A2 2 0 0 1 6.65 7.6h10.7a2 2 0 0 1 1.85 1.3L21 13.3v3.2"/><path d="M3 16.5h18"/><circle cx="7.2" cy="16.5" r="1.9"/><circle cx="16.8" cy="16.5" r="1.9"/><path d="M4.8 13.3h14.4"/>',
    rota: "/aluguel-de-carro",
    // 5 nomes — ciclo 11,0s. Comprimentos 11/8/7/5: coprimos dois a dois,
    // mmc(5,7,8,11) = 3080 paradas × 2,2s = 1h52min56s (FR-005 pede ≥ 1h).
    destinos: ["BRASIL", "CENTRO-OESTE", "NORDESTE", "SUDESTE", "SUL"],
    objeto: "campoUnico",
    detalhe: "grade",
  },
] as const;

/** Bloco 2 de cada portão ("o que está atrás"): lista densa do que a busca
 *  cobre. Zero card, zero ícone de linha (FR-016 §2). */
export const COBERTURA: Record<Produto["codigo"], readonly string[]> = {
  AER: [
    "Voos nacionais e internacionais, ida e volta ou só ida",
    "Companhias regulares, lado a lado na mesma busca",
    "Classe econômica e executiva, quando a rota tiver",
    "Emissão automática — o bilhete chega no e-mail após o pagamento aprovado",
    "Parcelamento em até 12x no cartão de crédito",
  ],
  HTL: [
    "Hotéis, pousadas e resorts no Brasil e no exterior",
    "Filtro por categoria de quarto e por regime de hospedagem",
    "Fotos, avaliações de hóspedes e política de cancelamento de cada propriedade",
    "Reserva com voucher enviado por e-mail assim que o pagamento é aprovado",
    "Parcelamento em até 12x no cartão de crédito",
  ],
  PCT: [
    "Passagem aérea e hospedagem no mesmo carrinho, com um pagamento só",
    "Combinações de destino e datas montadas na hora da busca — não é roteiro fechado",
    "O regime de hospedagem do pacote é o mesmo escolhido para o hotel avulso",
    "Parcelamento em até 12x no cartão de crédito",
  ],
  CAR: [
    "Retirada em aeroportos e em endereços no centro das principais cidades",
    "Categorias de econômico a SUV, sujeitas à disponibilidade da locadora",
    "Comparação entre locadoras na mesma busca, sem trocar de site",
    "Parcelamento em até 12x no cartão de crédito",
  ],
} as const;

interface ItemFicha {
  rotulo: string;
  valor: string;
  fonte?: { texto: string; href: string };
}

/** Bloco 4 de cada portão: a ficha de fatos. Toda alegação VERIFICÁVEL
 *  carrega `fonte` (FR-031 · Princípio VI) — o mesmo padrão que o FAQ da capa
 *  já usa com a consulta SUSEP. A ausência de preço entra aqui porque os
 *  portões passam a ser a primeira tela do tráfego orgânico, e o Princípio VI
 *  pede a declaração "onde o usuário a encontre". */
export const FICHA: Record<Produto["codigo"], readonly ItemFicha[]> = {
  AER: [
    { rotulo: "Abrangência", valor: "Brasil e exterior" },
    { rotulo: "Formas de pagamento", valor: "Cartão de crédito, em até 12x" },
    { rotulo: "Prazo de emissão", valor: "Automático, logo após o pagamento ser aprovado" },
    { rotulo: "Quem emite o bilhete", valor: "A companhia aérea escolhida na busca" },
    { rotulo: "Preço", valor: "Não exibido aqui — o valor válido é o da busca no momento da compra" },
    {
      rotulo: "Quem opera este site",
      valor: "Autogestor Viagens, frente de turismo do Grupo Autogestor",
      fonte: { texto: "Quem opera e quem emite", href: "/sobre" },
    },
  ],
  HTL: [
    { rotulo: "Abrangência", valor: "Brasil e exterior" },
    { rotulo: "Formas de pagamento", valor: "Cartão de crédito, em até 12x" },
    { rotulo: "Prazo de confirmação", valor: "Automático, logo após o pagamento ser aprovado" },
    { rotulo: "Quem hospeda", valor: "A rede ou o hotel escolhido na busca" },
    { rotulo: "Preço", valor: "Não exibido aqui — o valor válido é o da busca no momento da compra" },
    {
      rotulo: "Quem opera este site",
      valor: "Autogestor Viagens, frente de turismo do Grupo Autogestor",
      fonte: { texto: "Quem opera e quem emite", href: "/sobre" },
    },
  ],
  PCT: [
    { rotulo: "Abrangência", valor: "Voo + hospedagem, Brasil e exterior" },
    { rotulo: "Formas de pagamento", valor: "Cartão de crédito, em até 12x, num pagamento só" },
    { rotulo: "Prazo de emissão", valor: "Automático, logo após o pagamento ser aprovado" },
    { rotulo: "Quem emite", valor: "A companhia aérea e a rede hoteleira escolhidas na busca" },
    { rotulo: "Preço", valor: "Não exibido aqui — o valor válido é o da busca no momento da compra" },
    {
      rotulo: "Quem opera este site",
      valor: "Autogestor Viagens, frente de turismo do Grupo Autogestor",
      fonte: { texto: "Quem opera e quem emite", href: "/sobre" },
    },
  ],
  CAR: [
    { rotulo: "Abrangência", valor: "Principais cidades e aeroportos do Brasil" },
    { rotulo: "Formas de pagamento", valor: "Cartão de crédito, em até 12x" },
    { rotulo: "Prazo de confirmação", valor: "Automático, logo após o pagamento ser aprovado" },
    { rotulo: "Quem loca o carro", valor: "A locadora escolhida na busca" },
    { rotulo: "Preço", valor: "Não exibido aqui — o valor válido é o da busca no momento da compra" },
    {
      rotulo: "Quem opera este site",
      valor: "Autogestor Viagens, frente de turismo do Grupo Autogestor",
      fonte: { texto: "Quem opera e quem emite", href: "/sobre" },
    },
  ],
} as const;

/** Bloco 3 de cada portão: o "detalhe ampliado", único por produto (FR-020).
 *  A FORMA do dado muda por portão — é o que a regra de variação pede
 *  (data-model.md §4.1). */

/** AER `comparacao` — companhias que entram na busca, lado a lado. Nome em
 *  TIPOGRAFIA, nunca logotipo: marcas registradas de terceiros, sem ativo
 *  licenciado neste repositório (FR-021). */
export const COMPANHIAS_AER = [
  "LATAM",
  "GOL",
  "Azul",
  "American Airlines",
  "Air France",
  "TAP Portugal",
  "Iberia",
  "Copa Airlines",
] as const;

interface RegimeHtl {
  regime: string;
  oQueInclui: string;
}

/** HTL `estados` — os regimes de hospedagem como quatro estados da mesma pá.
 *  Regime é fato do formulário da plataforma, não do inventário de um
 *  hotel específico. */
export const REGIMES_HTL: readonly RegimeHtl[] = [
  { regime: "Somente quarto", oQueInclui: "Hospedagem, sem refeições incluídas" },
  { regime: "Café da manhã", oQueInclui: "Hospedagem e café da manhã" },
  { regime: "Meia pensão", oQueInclui: "Café da manhã e mais uma refeição" },
  { regime: "Pensão completa", oQueInclui: "Café da manhã, almoço e jantar" },
] as const;

/** PCT `duasColunas` — o que entra e o que NÃO entra no mesmo preço é tão
 *  obrigatório quanto o que entra (data-model.md §4.1). */
export const PACOTE_COBERTURA = {
  entra: ["Passagem aérea, ida e volta", "Hospedagem no regime escolhido", "Taxas de embarque"],
  naoEntra: ["Seguro viagem", "Passeios e ingressos", "Refeições fora do regime contratado", "Traslado aeroporto–hotel"],
} as const;

interface AeroportoCar {
  iata: string;
  cidade: string;
}

/** CAR `grade` — aeroportos de retirada em códigos IATA. Fato público e
 *  verificável (data-model.md §4.1), não inventário de uma locadora. */
export const AEROPORTOS_CAR: readonly AeroportoCar[] = [
  { iata: "GRU", cidade: "São Paulo" },
  { iata: "GIG", cidade: "Rio de Janeiro" },
  { iata: "BSB", cidade: "Brasília" },
  { iata: "CNF", cidade: "Belo Horizonte" },
  { iata: "SSA", cidade: "Salvador" },
  { iata: "POA", cidade: "Porto Alegre" },
  { iata: "REC", cidade: "Recife" },
  { iata: "GYN", cidade: "Goiânia" },
] as const;

interface MetaPortao {
  titulo: string;
  descricao: string;
  bluf: string;
}

/** Metadados por portão (FR-024, data-model.md §4.2). Nenhum herda o
 *  `<title>` da capa: `descricao` vende o clique, `bluf` responde a pergunta
 *  — são textos diferentes, de propósito. */
export const META_PORTAO: Record<Produto["codigo"], MetaPortao> = {
  AER: {
    titulo: "Passagens aéreas nacionais e internacionais | Autogestor Viagens",
    descricao:
      "Compare companhias aéreas na mesma busca, nacional e internacional, e pague em até 12x no cartão. Sem cadastro para ver a comparação.",
    bluf:
      "Aqui você compara passagem aérea de várias companhias na mesma busca — nacional e internacional — antes de decidir onde comprar. A busca é grátis, sem cadastro, e o pagamento sai em até 12x no cartão de crédito.",
  },
  HTL: {
    titulo: "Hotéis e resorts, Brasil e exterior | Autogestor Viagens",
    descricao:
      "Compare hotéis, pousadas e resorts por categoria de quarto e regime de hospedagem, com pagamento em até 12x no cartão.",
    bluf:
      "Aqui você compara hotéis, pousadas e resorts no Brasil e no exterior, filtrando por categoria de quarto e por regime de hospedagem, antes de decidir onde reservar. Pagamento em até 12x no cartão de crédito.",
  },
  PCT: {
    titulo: "Pacotes de viagem — voo e hotel juntos | Autogestor Viagens",
    descricao:
      "Monte voo e hospedagem no mesmo carrinho, com um pagamento só, em até 12x no cartão. Veja o que entra e o que não entra no pacote.",
    bluf:
      "Aqui voo e hospedagem entram no mesmo carrinho e saem num pagamento só, em até 12x no cartão. O pacote é montado na hora da busca, com as datas e o destino que você escolher — não é um roteiro fechado.",
  },
  CAR: {
    titulo: "Aluguel de carro em todo o Brasil | Autogestor Viagens",
    descricao:
      "Compare locadoras na mesma busca, com retirada e devolução no aeroporto ou no centro da cidade, em até 12x no cartão.",
    bluf:
      "Aqui você compara aluguel de carro entre locadoras na mesma busca, com retirada e devolução no aeroporto de chegada ou no centro da cidade, antes de decidir onde alugar. Pagamento em até 12x no cartão de crédito.",
  },
} as const;

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
