# Contribuindo com a Lumen

Obrigado pelo interesse. Este projeto prioriza clareza editorial, acessibilidade e uma experiência de leitura calma.

## Antes de abrir um PR

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Se o seu change alterar o acervo, rode também:

```bash
npm run sources:fetch
npm run assets:generate
npm run verify:editions
npm run search:index
```

## Commits

O repositório usa [Conventional Commits](https://www.conventionalcommits.org/) e o hook `commit-msg` aplica a regra.

```text
feat(reader): restore EPUB position from IndexedDB
fix(search): keep Pagefind locale filter in sync
docs: explain catalogue import flow
test(catalog): cover combined format filters
```

Escopos sugeridos: `catalog`, `reader`, `search`, `i18n`, `a11y`, `ui`, `ci`, `content`.

## Conteúdo e direitos

- Só inclua obras cujo status de domínio público esteja verificado para a jurisdição de publicação.
- Use edições integrais no idioma original e registre `source.provider`, `source.publisher`, `source.url`, `source.license` e `source.edition` em `content/books.json`.
- Documente a captura em `docs/content-sources.md` e valide o arquivo com `npm run verify:editions`.
- Capas e textos editoriais novos devem ser enviados junto com a origem e a licença.
- Não inclua traduções, prefácios ou imagens de terceiros sem autorização explícita.
- Autores com direitos ativos podem aparecer como perfis biográficos com links oficiais; não hospede os textos ou capas desses autores.

## Acessibilidade

Todo PR de interface deve manter:

- navegação completa por teclado;
- foco visível e ordem de foco coerente;
- nomes acessíveis em botões de ícone;
- contraste de texto AA;
- respeito a `prefers-reduced-motion`;
- nenhuma informação transmitida apenas por cor.

Descreva no PR como o fluxo foi verificado com teclado e, quando aplicável, leitor de tela.
