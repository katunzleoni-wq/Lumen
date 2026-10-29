# Fontes e procedência do acervo

Data de captura e verificação: **2026-10-21**.

Este documento registra a origem de cada edição publicada em `public/books/` e a
base legal usada para incluí-la. Todas as obras hospedadas são edições
**originais em francês ou inglês**, em domínio público. Não hospedamos traduções
modernas sem autorização, capas comerciais, nem textos de autores com direitos ativos.

## Obras incluídas

| Obra                                                 | Autor              | Ano  | Idioma | Edição de origem                    | Fonte             | URL                                             | Licença                                            | Arquivo                                                            |
| ---------------------------------------------------- | ------------------ | ---- | ------ | ----------------------------------- | ----------------- | ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| O Livro dos Espíritos                                | Allan Kardec       | 1857 | pt     | Tradução de Guillon Ribeiro · FEB   | FEB               | https://www.febeditora.com.br/                  | Licença FEB 2026 · uso não comercial               | `o-livro-dos-espiritos.epub` e `.pdf`                              |
| O Evangelho segundo o Espiritismo                    | Allan Kardec       | 1864 | pt     | Tradução de Guillon Ribeiro · FEB   | FEB               | https://www.febeditora.com.br/                  | Licença FEB 2026 · uso não comercial               | `o-evangelho-segundo-o-espiritismo.epub` e `.pdf`                  |
| O Livro dos Médiuns                                  | Allan Kardec       | 1861 | pt     | Tradução de Guillon Ribeiro · FEB   | FEB               | https://www.febeditora.com.br/                  | Licença FEB 2026 · uso não comercial               | `o-livro-dos-mediuns.epub` e `.pdf`                                |
| O Céu e o Inferno                                    | Allan Kardec       | 1865 | pt     | Tradução de Guillon Ribeiro · FEB   | FEB               | https://www.febeditora.com.br/                  | Licença FEB 2026 · uso não comercial               | `o-ceu-e-o-inferno.epub` e `.pdf`                                  |
| A Gênese                                             | Allan Kardec       | 1868 | pt     | Tradução de Guillon Ribeiro · FEB   | FEB               | https://www.febeditora.com.br/                  | Licença FEB 2026 · uso não comercial               | `a-genese.epub` e `.pdf`                                           |
| Depois da Morte                                      | Léon Denis         | 1890 | pt     | Tradução FEB · edição digital 2008  | FEB               | https://www.febnet.org.br/                      | Licença FEB global de 29/10/2026                   | `depois-da-morte.pdf`                                              |
| Après la mort                                        | Léon Denis         | 1890 | fr     | Édition de 1922                     | cslak             | https://cslak.fr/                               | Domínio público                                    | `apres-la-mort.pdf`                                                |
| Instruction pratique sur les manifestations spirites | Allan Kardec       | 1858 | fr     | E. Dentu, Paris, 1858               | Internet Archive  | https://archive.org/details/bub_gb_o2bo1lt3i00C | Public Domain Mark 1.0                             | `instrucao-pratica-sobre-as-manifestacoes-espiritas.epub` e `.pdf` |
| Mysterious Psychic Forces                            | Camille Flammarion | 1907 | en     | English edition, 1907; eBook #39279 | Project Gutenberg | https://www.gutenberg.org/ebooks/39279          | Domínio público nos EUA; Project Gutenberg License | `mysterious-psychic-forces.epub`                                   |
| Lumen                                                | Camille Flammarion | 1872 | en     | English translation; eBook #43835   | Project Gutenberg | https://www.gutenberg.org/ebooks/43835          | Domínio público nos EUA; Project Gutenberg License | `lumen.epub`                                                       |
| The Vital Message                                    | Arthur Conan Doyle | 1919 | en     | First edition, 1919; eBook #439     | Project Gutenberg | https://www.gutenberg.org/ebooks/439            | Domínio público nos EUA; Project Gutenberg License | `the-vital-message.epub`                                           |

O campo `source.publisher` de `content/books.json` registra a editora-fonte de
cada edição; `source.provider`, `source.url`, `source.license` e
`source.capturedAt` completam a procedência exibida na página da obra.

### Observações de licença

- **Wikisource (Le Livre des Esprits):** o texto da obra é de domínio público. A
  transcrição comunitária é distribuída sob **CC BY-SA 4.0**; o EPUB gerado a
  partir dela mantém essa licença e inclui a atribuição na nota editorial. O
  código da aplicação continua sob MIT; a licença do conteúdo é independente.
- **Internet Archive:** os quatro itens indicados estão marcados como
  **Public Domain Mark 1.0**. O texto é OCR de digitalizações Google de edições
  oitocentistas. Não foram utilizadas as traduções inglesas do International
  Spiritist Council, nem edições comentadas modernas.
- **Project Gutenberg:** os três EPUBs são cópias oficiais do Project Gutenberg,
  preservadas sem modificação. A marca e a licença do Project Gutenberg são
  respeitadas; o projeto não cobra pelo acesso.
- **FEB:** as cinco obras de Kardec e _Depois da Morte_, de Léon Denis, usam
  edições FEB autorizadas. A licença global de 29/10/2026 está registrada em
  [`docs/licenses/feb-2026.md`](licenses/feb-2026.md). As edições Lumen têm capa
  própria; as capas e os elementos editoriais da FEB só devem ser usados quando
  expressamente cobertos pela licença.
- **Léon Denis (francês):** _Après la mort_ usa o original de 1922 em domínio
  público, obtido em `cslak.fr`; a capa é uma criação Lumen.

## Transformação editorial

1. Os arquivos de origem são baixados para `content-sources/raw/`, que não é
   versionado.
2. `npm run assets:generate` executa `scripts/build-real-editions.mjs`:
   - Wikisource: o HTML do “Texte entier” é dividido em introdução, prolegômenos
     e capítulos de cada um dos quatro livros;
   - Internet Archive: o OCR é limpo (cabeçalhos correntes, números de página,
     carimbos do Google, hifenização) e segmentado pelos capítulos localizados
     em `content/editions.json`;
   - Project Gutenberg: o EPUB original é copiado sem alteração.
3. Capas, sumário do site e metadados localizados são produções da Lumen. Nenhuma
   capa comercial é reutilizada.
4. `npm run verify:editions` verifica, para cada arquivo:
   - abertura do ZIP e presença de `META-INF/container.xml` e do pacote OPF;
   - `dc:title`, `dc:creator`, `dc:language` e idioma coerente com o catálogo;
   - documento de navegação EPUB (`nav`) ou NCX com entradas;
   - capa declarada e arquivo de capa existente;
   - hash SHA-256 igual ao registrado em `content/editions.lock.json`;
   - PDF válido, com 164 páginas, no caso da Instrução Prática.

O OCR preserva erros do original digitalizado. As edições não se apresentam
como edições críticas. O texto integral está no idioma original; títulos,
sinopses e metadados do site são traduzidos para português, inglês, espanhol e
francês pela equipe editorial.

## Fontes rejeitadas

Estas fontes foram examinadas e **não** foram usadas nem incluídas no repositório:

| Item                                                      | Motivo da rejeição                                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| _The Spirits’ Book_ (Internet Archive, edição em inglês)  | Texto contém “Copyright © 2006 International Spiritist Council”. A marcação de domínio público no IA não corresponde ao conteúdo.  |
| _What is Spiritism?_ (Internet Archive, edição em inglês) | Texto contém “Copyright © 2010 International Spiritist Council”.                                                                   |
| _Le Ciel et l’Enfer_ (OCR)                                | “Copyright (C) 2006 Encyclopédie Spirite”.                                                                                         |
| _Qu’est-ce que le Spiritisme ?_ (OCR/Gallica)             | Termos de reutilização não comercial da BnF; fora da política de licença do projeto.                                               |
| _Œuvres posthumes_ (OCR)                                  | “Nouvelle édition conforme à l’édition de 1927”; edição editorial moderna, não a original.                                         |
| _Le Livre des Médiums_ (item CC BY-NC-ND)                 | Licença incompatível com a redistribuição aberta do EPUB.                                                                          |
| Traduções brasileiras modernas de Kardec                  | Protegidas. A exceção é a edição de _O Livro dos Médiuns_ expressamente autorizada pela FEB em 2026; as demais seguem sem licença. |

## Autores com direitos ativos

**Chico Xavier (1910–2002)**, **Divaldo Pereira Franco (1927–)** e **Yvonne do
Amaral Pereira (1900–1980)** não têm textos, trechos ou capas hospedados. A
página “Sobre” apresenta somente perfis biográficos e links para as editoras
oficiais (FEB Editora e LEAL), em conformidade com a solicitação de inclusão
desses autores no projeto. Qualquer aquisição ou empréstimo deve ser feita nos
canais oficiais.

## Reprodutibilidade

```bash
npm run sources:fetch     # baixa as fontes públicas para content-sources/raw
npm run assets:generate   # reconstrói EPUBs, PDF e capas
npm run assets:verify     # valida estrutura, metadados, sumário, capa e hashes
npm run build:feb            # gera O Livro dos Médiuns em PT
npm run build:feb:espiritos  # gera O Livro dos Espíritos em PT
npm run build:feb:evangelho  # gera O Evangelho segundo o Espiritismo em PT
npm run build:feb:ceu        # gera O Céu e o Inferno em PT
npm run build:feb:genese     # gera A Gênese em PT
npm run verify:feb           # valida as edições PT, créditos, capa e sumário
```

Os arquivos brutos e as capas PNG de build ficam em `content-sources/raw/` e
`content-sources/build/`, ambos ignorados pelo Git. Os EPUBs, o PDF e as capas
SVG finais são versionados para que a aplicação funcione offline após o
`npm install`.
