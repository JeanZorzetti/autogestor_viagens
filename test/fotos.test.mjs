// A superfície de risco da direção "janela de embarque": a FOTOGRAFIA.
//
// Ela é a matéria da página, e as três coisas abaixo quebram em silêncio —
// não derrubam build, não derrubam tipo, não sujam o console. Aparecem em
// produção, como um buraco na cor média da foto, uma transição que sumiu, ou
// um crédito com o nome do autor errado.
//
// `node --test test/*.test.mjs`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";

const ler = (caminho) => readFileSync(caminho, "utf8");
const manifesto = () => {
  const fonte = ler("src/data/fotos.ts");
  const bloco = fonte.match(/export const FOTOS: Record<string, Foto> = (\{[\s\S]*?\n\});/)?.[1];
  assert.ok(bloco, "não achei FOTOS em src/data/fotos.ts — rode `npm run fotos`");
  return JSON.parse(bloco);
};

test("todo arquivo que o manifesto promete existe em public/img, nos dois formatos", () => {
  // O <img srcset> é montado a partir de `larguras`. Uma largura no manifesto
  // sem o arquivo correspondente vira um 404 que o navegador resolve caindo
  // para outro degrau — ou, se for o único, deixando o poster no lugar da
  // foto. Nenhum dos dois aparece no console.
  const fotos = manifesto();
  assert.ok(Object.keys(fotos).length >= 5, "esperava ao menos as cinco fotos do site");

  for (const [nome, foto] of Object.entries(fotos)) {
    assert.ok(foto.larguras.length >= 2, `${nome}: um degrau só não é srcset responsivo`);
    for (const largura of foto.larguras) {
      for (const ext of ["avif", "webp"]) {
        const caminho = `public/img/f-${nome}-${largura}.${ext}`;
        assert.ok(existsSync(caminho), `${caminho} não existe — rode \`npm run fotos\``);
        assert.ok(statSync(caminho).size > 1024, `${caminho} tem menos de 1kb: arquivo truncado`);
      }
    }
    assert.match(foto.cor, /^rgb\(\d+ \d+ \d+\)$/, `${nome}: cor de poster inválida (${foto.cor})`);
  }
});

test("cada produto tem a fotografia do próprio portão", () => {
  // O componente Foto lança no build quando a chave não existe, o que cobre o
  // caso de a foto sumir. O que ele NÃO cobre é o inverso: um produto novo
  // entrando em conteudo.ts sem ninguém baixar a imagem dele. A capa monta a
  // peça a partir de `produto.codigo.toLowerCase()`, então a convenção é o
  // contrato — e contrato implícito é o que quebra na quinta vertical.
  const bloco = ler("src/data/conteudo.ts").match(
    /export const PRODUTOS(?:\s*:[^=]+)?\s*=\s*\[([\s\S]*?)\]\s*as const;/,
  )?.[1];
  assert.ok(bloco, "não achei PRODUTOS em src/data/conteudo.ts");

  const codigos = [...bloco.matchAll(/codigo:\s*"(\w+)"/g)].map((m) => m[1].toLowerCase());
  assert.equal(codigos.length, 4);

  const fotos = manifesto();
  for (const c of codigos) {
    assert.ok(fotos[c], `o produto ${c.toUpperCase()} não tem foto: rode \`npm run fotos\``);
    assert.equal(fotos[c].papel, "peca", `a foto de ${c} precisa ser do papel "peca" (4:5)`);
  }
  assert.equal(fotos.saguao?.papel, "abertura", "a foto da abertura da capa sumiu do manifesto");
});

test("a fotografia atravessa a transição: o mesmo view-transition-name nos dois documentos", () => {
  // A camada 4 da coreografia é a única que some SEM DEIXAR RASTRO. Se o nome
  // divergir entre a peça da vitrine e a abertura do portão, o navegador não
  // reclama: ele simplesmente faz o corte padrão de página, e o gesto que
  // liga a capa ao portão desaparece. Ninguém percebe olhando uma tela — só
  // olhando a passagem entre duas.
  const capa = ler("src/pages/index.astro");
  const portao = ler("src/components/CabecaDePortao.astro");

  const nomeNa = (fonte, arquivo) => {
    const m = fonte.match(/view-transition-name:\s*vt-\$\{(\w+)\}/);
    assert.ok(m, `${arquivo} não declara um view-transition-name interpolado`);
    return m[1];
  };
  // Os dois têm que interpolar a MESMA expressão de origem. Na capa e no
  // portão a variável se chama `foto`, e nos dois ela sai de
  // `produto.codigo.toLowerCase()` — é isso que garante que `vt-htl` na peça
  // encontre `vt-htl` na abertura.
  assert.equal(nomeNa(capa, "index.astro"), "foto");
  assert.equal(nomeNa(portao, "CabecaDePortao.astro"), "foto");

  for (const [fonte, arquivo] of [
    [capa, "index.astro"],
    [portao, "CabecaDePortao.astro"],
  ]) {
    assert.match(
      fonte,
      /const foto = (?:p|produto)\.codigo\.toLowerCase\(\)/,
      `${arquivo}: o nome da transição precisa sair de produto.codigo.toLowerCase()`,
    );
  }
});

test("nenhuma fotografia é Unsplash+ e todas têm crédito com link", () => {
  // Este teste existe porque o repositório JÁ publicou duas imagens de licença
  // paga, com marca d'água, por seis sessões: na direção anterior a foto
  // entrava a 11% de opacidade em cinza, e a marca d'água estava lá o tempo
  // todo, invisível. O guarda que impede de baixar mora em
  // logos/baixar-fotos.mjs; este aqui guarda o outro lado — que o arquivo de
  // crédito não fique para trás quando alguém troca uma foto à mão.
  const creditos = JSON.parse(ler("public/img/FOTOS.json"));
  const fotos = manifesto();

  assert.equal(
    creditos.length,
    Object.keys(fotos).length,
    "FOTOS.json e o manifesto discordam no número de fotos — rode `npm run fotos`",
  );

  for (const c of creditos) {
    assert.ok(fotos[c.nome], `crédito de "${c.nome}", que não está no manifesto`);
    assert.ok(c.autor && c.autor.length > 1, `${c.nome}: crédito sem autor`);
    assert.match(c.pagina ?? "", /^https:\/\/unsplash\.com\/photos\//, `${c.nome}: sem link da foto de origem`);
    assert.match(c.autorLink ?? "", /^https:\/\/unsplash\.com\//, `${c.nome}: sem link do autor`);
  }
});
