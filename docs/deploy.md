# Preview na Vercel

O projeto está pronto para um deploy de homologação. Este repositório ainda não
tem remote nem credenciais da Vercel; os passos abaixo são os que faltam.

## 1. Publicar o repositório

```bash
git remote add origin https://github.com/SEU-USUARIO/lumen-biblioteca.git
git push -u origin main
```

## 2. Importar na Vercel

1. Crie um projeto em [vercel.com/new](https://vercel.com/new).
2. Importe o repositório.
3. Framework: **Next.js**.
4. Build command: `npm run build`.
5. Install command: `npm ci`.
6. Node: **20.x**.

## 3. Variáveis de ambiente

Obrigatória:

```env
NEXT_PUBLIC_SITE_URL=https://SEU-PREVIEW.vercel.app
```

Contato por e-mail (Resend):

```env
NEXT_PUBLIC_CONTACT_ENABLED=true
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=contato@seudominio.org
CONTACT_FROM_EMAIL=Lumen <no-reply@seudominio.org>
```

O formulário só aparece quando as quatro variáveis estão presentes. Sem elas,
`/sobre` mostra “Canal de contato em preparação” e a API responde `503`.

### Resend

1. Crie uma API key em [resend.com/api-keys](https://resend.com/api-keys).
2. Verifique o domínio em [resend.com/domains](https://resend.com/domains).
3. Use um remetente do domínio verificado em `CONTACT_FROM_EMAIL`.
4. Enquanto o domínio não estiver verificado, use o remetente de teste do Resend
   apenas para testes controlados.

O envio usa `reply_to` com o e-mail do visitante e não grava mensagens no disco.

## 4. Deploy de preview

Pela interface da Vercel, use **Deploy Preview** (não produção). Pela CLI:

```bash
npx vercel link
npx vercel env pull .env.local
npx vercel deploy
```

Confirme a URL do preview e teste:

- `/pt/biblioteca` → 8 obras;
- `/en/biblioteca` → 3 obras;
- `/fr/biblioteca` → 4 obras;
- `/es/biblioteca` → 15 obras com aviso;
- uma obra em cada idioma;
- troca PT/FR na página e no leitor;
- PDF e EPUB;
- `/pt/licencas` e o PDF da FEB;
- `/pt/sobre` com o formulário de contato ativo (se as variáveis estiverem configuradas).

## 5. Limitações do preview

- O rate limit do contato é em memória; em várias instâncias, troque por
  Upstash Redis.
- Ainda não há service worker; não prometa leitura offline.
- O acervo em inglês tem 3 obras e não há edição japonesa.
- A licença da FEB é não exclusiva, gratuita e limitada ao escopo autorizado.

## 6. Só depois: produção

Configure o domínio definitivo, atualize `NEXT_PUBLIC_SITE_URL`, rode o roteiro
acima novamente e só então promova o deploy para produção.
