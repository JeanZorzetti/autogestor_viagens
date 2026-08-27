/** NAP (nome/endereço/telefone) e destinos externos.
 *
 *  DUPLICADO DO HUB DE PROPÓSITO, não importado. Este repositório não tem
 *  dependência de build em `C:\dev\autogestor` — é a mesma regra que o
 *  `coopluz` e o `seguros` seguem ("nenhum import atravessando a fronteira").
 *  Ao mudar telefone, endereço, fundação ou horário no hub, replicar aqui à
 *  mão. O telefone é o MESMO do hub: é o número impresso nas peças de
 *  captação da Autogestor Viagens (agosto/2026). */
export const EMPRESA = {
  nome: "Autogestor Viagens",
  nomeLegal: "Grupo Autogestor Adm de Serviços — Seguros, Financiamentos e Turismo",
  fundacao: "2004",
  /** Registro de corretora. Aparece aqui porque a mesma empresa que opera esta
   *  agência é a corretora que vende o seguro viagem — a alegação do FAQ
   *  precisa do número e do caminho de verificação junto. */
  susep: "202070004",
  telefone: "+5562982622220",
  telefoneExibicao: "(62) 98262-2220",
  email: "atendimento@autogestor.com.br",
  endereco: {
    rua: "Av. Itália, 1326",
    bairro: "Jardim Europa",
    cidade: "Goiânia",
    uf: "GO",
    cep: "74325-110",
    pais: "BR",
  },
  geo: { lat: -16.7089, lon: -49.2325 },
  redes: [
    "https://www.instagram.com/autogestorseguros/",
    "https://www.facebook.com/autogestorseguros/",
    "https://twitter.com/autogestors",
  ],
} as const;

export const SITE = {
  nome: "Autogestor Viagens",
  url: "https://viagens.roilabs.com.br",
  /** O hub continua sendo a matriz das seis frentes. Declarado no JSON-LD como
   *  `parentOrganization` para os dois domínios não aparecerem como empresas
   *  diferentes com o mesmo endereço e telefone. */
  hub: "https://autogestor.roilabs.com.br",
} as const;

export const enderecoLinha = `${EMPRESA.endereco.rua} — ${EMPRESA.endereco.bairro}, ${EMPRESA.endereco.cidade}/${EMPRESA.endereco.uf}, CEP ${EMPRESA.endereco.cep}`;

/** Link de WhatsApp com mensagem pronta. O contexto no texto poupa a primeira
 *  pergunta do atendente. */
export function whatsapp(mensagem: string): string {
  return `https://wa.me/${EMPRESA.telefone.replace("+", "")}?text=${encodeURIComponent(mensagem)}`;
}

export const EXTERNOS = {
  /** A busca. É o destino de TODO CTA deste site — a página inteira existe
   *  para produzir este clique. Fica numa constante porque aparece em ~12
   *  lugares e trocar de operadora não pode virar caça a URL em 6 arquivos. */
  busca: "https://br.onertravel.com/autogestorviagens/home",
  /** Consulta pública de corretores da SUSEP. O FAQ afirma um registro; sem o
   *  caminho para conferir, é só um número na tela. */
  susepConsulta: "https://www2.susep.gov.br/safe/Corretores/pesquisa",
  /** Cadastur — cadastro obrigatório de prestador de turismo no Ministério do
   *  Turismo. A consulta é pública e o site NÃO afirma número de cadastro
   *  próprio: afirmar registro sem ter o número é o tipo de alegação que
   *  motor de resposta não cita e que órgão de defesa do consumidor cobra. */
  cadastur: "https://cadastur.turismo.gov.br/hotsite/#!/public/sou-turista/inicio",
} as const;

export const ATENDIMENTO = {
  /** Encaixa depois de um verbo: "responde <prazo>". */
  prazo: "no mesmo dia útil",
  horario: "de segunda a sexta, das 8h às 18h",
  horarioCurto: "seg–sex, 8h–18h",
  horarioSchema: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "18:00",
  },
} as const;

/** Mesma propriedade do hub: as seis frentes são um funil só. */
export const GA4 = "G-SHG12H2NZX";

/** Data da última revisão dos textos legais. Política sem data é política que
 *  ninguém sabe se ainda vale. */
export const LEGAL_ATUALIZADO = "2026-08-27";
