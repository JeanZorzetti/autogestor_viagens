/* GERADO por logos/baixar-fotos.mjs — não edite à mão.
   Créditos com autor e link em public/img/FOTOS.json. */

export type Foto = {
  papel: "abertura" | "peca";
  larguras: number[];
  razao: number;
  /** Média da imagem em sRGB. Pintada como background do container enquanto o
      arquivo decodifica — o poster desta direção, e o que impede o flash de
      navy chapado no lugar onde vai entrar uma fotografia colorida. */
  cor: string;
};

export const FOTOS: Record<string, Foto> = {
  "saguao": {
    "papel": "abertura",
    "larguras": [
      760,
      1280,
      1920
    ],
    "razao": 1.7777777777777777,
    "cor": "rgb(50 61 64)"
  },
  "aer": {
    "papel": "peca",
    "larguras": [
      520,
      1040
    ],
    "razao": 0.8,
    "cor": "rgb(105 95 88)"
  },
  "htl": {
    "papel": "peca",
    "larguras": [
      520,
      1040
    ],
    "razao": 0.8,
    "cor": "rgb(68 77 105)"
  },
  "pct": {
    "papel": "peca",
    "larguras": [
      520,
      1040
    ],
    "razao": 0.8,
    "cor": "rgb(108 116 146)"
  },
  "car": {
    "papel": "peca",
    "larguras": [
      520,
      1040
    ],
    "razao": 0.8,
    "cor": "rgb(114 93 83)"
  }
};

/** Altura do arquivo daquela largura. É conta, não tabela: a razão está no
    manifesto e derivar aqui garante que width/height do <img> nunca divirjam
    do que o encoder produziu. */
export const alturaDe = (nome: string, largura: number) =>
  Math.round(largura / FOTOS[nome].razao);
