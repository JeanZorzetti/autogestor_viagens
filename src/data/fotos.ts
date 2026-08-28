/* GERADO por logos/baixar-fotos.mjs — não edite à mão.
   Chave da parede → onde o corte de `cover` tem que cair naquela foto.
   Fotografias do Unsplash (licença livre, sem atribuição obrigatória); os
   créditos, com autor e link, ficam em public/img/FOTOS.json. */

export const FOTO_FOCO: Record<string, string> = {
  "aer": "30% 60%",
  "htl": "50% 50%",
  "pct": "50% 40%",
  "car": "50% 55%",
  "saguao": "50% 52%",
};

/* As dimensões REAIS do recorte, para os atributos width/height do <img>.
   Quem segura o CLS aqui é a altura fixa do container (--saguao-h, em
   tokens.css), não estes números — mas um <img> que declara um tamanho
   diferente do arquivo é uma mentira no HTML que custa zero para não contar.
   Saem do recorte feito no encoder, não de uma conta à mão que envelhece na
   primeira troca de foto. */
export const SAGUAO = { largura: 1440, altura: 302 } as const;
