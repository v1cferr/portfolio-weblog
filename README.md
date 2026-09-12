# Início

- **Nome do projeto**: portfolio-weblog
- **URL/Domínio**: <https://v1cferr.dev>
  - **Registro**: Hostinger
- **Tecnologias**:
  - Next.js 15 (App Router + TypeScript)
  - Tailwind CSS
  - DaisyUI
- **Hospedagem (PaaS)**: Vercel
- **BaaS (Backend as a service)**: Supabase

## Estrutura do Projeto

```bash
.
├── .envrc                   # Seleciona o dev shell do Nix via direnv
├── .github/                 # Workflows, templates e configs do GitHub
├── .vscode/                 # Configurações específicas do VS Code
├── public/                  # Arquivos públicos (imagens, favicon, etc.)
│   └── languages/           # Arquivos de tradução/idiomas
├── src/                     # Código-fonte principal
│   ├── app/                 # Rotas e páginas do Next.js (App Router)
│   │   ├── [api]/           # Rotas de API customizadas
│   │   ├── [locale]/        # Rotas internacionalizadas
│   │   │   ├── (professional)/  # Páginas profissionais
│   │   │   ├── (knowledge)/     # Páginas de conhecimento
│   │   │   ├── (personal)/      # Páginas pessoais
│   │   │   ├── [...rest]/       # Catch-all para rotas não mapeadas
│   │   │   ├── layout.tsx       # Layout principal das rotas de locale
│   │   │   ├── not-found.tsx    # Página 404 customizada
│   │   │   └── page.tsx         # Página principal do locale
│   ├── components/          # Componentes reutilizáveis React
│   ├── i18n/                # Configuração e arquivos de internacionalização
│   ├── styles/              # Estilos globais e utilitários CSS/Tailwind
│   ├── utils/               # Funções utilitárias/helpers
│   ├── types/               # Tipos personalizados
│   └── middleware.ts        # Middlewares do Next.js
├── supabase/                # Configurações e schemas do Supabase
├── flake.nix                # Dev shell com node, pnpm, deno e supabase CLI
├── flake.lock               # Versões fixadas do nixpkgs
├── ...
└── README.md                # Documentação do projeto
```

## Motivo da escolha da tecnologia

Escolhi Next.js por ser um **framework full‑stack** que unifica front‑end e
back‑end em um único repositório monolito, aproveitando as seguintes vantagens:

- **App Router e Layouts Aninhados**: convenção de pastas para rotas, layouts e
  módulos de idiomas, proporcionando organização e escalabilidade da estrutura
  de pastas.
- **Renderização Híbrida (SSR, SSG, ISR)**:
  - **SSG** (Static Site Generation) gera HTML pré-renderizado em build time,
    ideal para conteúdo estático (posts e páginas pessoais).
  - **SSR** (Server Side Rendering) entrega páginas dinâmicas sob demanda,
    garantindo dados sempre atuais.
  - **ISR** (Incremental Static Regeneration) permite atualizações pontuais de
    páginas estáticas sem rebuild completo.
- **React Server Components**: possibilita executar lógica e busca de dados no
  servidor dentro de componentes, reduzindo o bundle enviado ao cliente e
  melhorando a performance.
- **API Routes Integradas e Edge Functions**: criação de endpoints REST/GraphQL
  diretamente em `app/api`, com possibilidade de rodar como funções serverless
  ou em edge runtime para latência mínima.
- **Otimizações Out‑of‑the‑box**:
  - **Image Optimization** com o componente `<Image>` para carregamento
    responsivo e lazy loading automático.
  - **Font Optimization** e split de código automático por rota.
  - **Middleware** nativo para adicionar cabeçalhos, autenticação e
    redirecionamentos de forma centralizada.
- **Experiência de Desenvolvimento e Productividade**:
  - **TypeScript First**: tipagem nativa, autocompletar e refatoração segura em
    toda a base de código.
  - **Hot Reload** e feedback instantâneo durante o desenvolvimento.
  - **Preview Deploys** no Vercel: cada PR gera um ambiente isolado com URL
    única para revisão.
- **SEO e Performance**:
  - Páginas pré-renderizadas melhoram tempo de carregamento e ranking em motores
    de busca.
  - Suporte a metadados dinâmicos e geração de sitemaps/robots sem configurações
    externas.
- **Ecosistema Maduro**:
  - Integrações oficiais (NextAuth, tRPC, Prisma, MDX, analytics, A/B testing).
  - Comunidade ativa e ampla documentação, facilitando solução de problemas.
- **Monorepo e Compartilhamento de Códigos**:
  - Fácil separação de pacotes e compartilhamento de hooks, tipos e serviços
    entre front-end e API.
  - Sinergia com ferramentas de CI/CD e Dev Containers, garantindo consistência
    entre ambientes de desenvolvimento.
- **Escalabilidade e Manutenção**:
  - Arquitetura modular que cresce com o projeto.
  - Atualizações frequentes e compatibilidade retroativa garantida pela equipe
    do Vercel.

Essa combinação de recursos faz do Next.js a escolha ideal para um personal hub
(portfolio‑weblog) que precisa ser:

1. **Rápido para desenvolver**: convenções e ferramentas integradas reduzem o
   tempo de configuração.
2. **Ótimo para SEO**: SSR/SSG garantem indexação e performance.
3. **Fácil de manter**: estrutura clara, tipagem e monorepo reduzem a dívida
   técnica.
4. **Preparado para crescer**: pode adicionar APIs, autenticação, analytics e
   funções edge conforme a demanda.

## Features

- 🌐 Suporte a múltiplos idiomas
- 🎨 Temas claros e escuros
- 📱 Design responsivo
- 🚀 Desempenho otimizado
- 📊 Integração com APIs externas (Blizzard, Spotify)

## Roadmap (melhorias)

- [ ] View Transition - <https://github.com/shuding/next-view-transitions>
- [ ] Uses `.mdx` files for blog posts -
      [Markdown and MDX](hhttps://nextjs.org/docs/app/building-your-application/configuring/mdx)
      **or:**
- [ ] Add a CMS - [Strapi](https://strapi.io/integrations/nextjs-cms)
- [ ] Customize the `404` page for `[locate]` and non-existent intl routes
- [ ] A ~~another~~ little badge for WIP things (like pages that are not ready
      yet)
- [ ] Add copyright and license (I made it but with so many resources)
- [ ] Add two buttons: to report a bug and/or suggest a feature
- [ ] Add a button to fast contact (work with me), someway to contact and/or
      download the resume-CV
- [ ] Weblog? (Posts, guides, tutorials, etc)
- [ ] Add the [roadmap.sh](https://roadmap.sh) in the "conhecimento" page
- [ ] Add a vertical reverse chronological timeline (resume-CV) using DaisyUI
- [ ] Add a "Projects" page with the projects I've worked on (Frontendmentor,
      XGuardian, etc)
- [ ] Add the data API requests to Google Spreadsheets (VSCode Extensions, WoW
      Addons, etc)
- [ ] Add animations using [Framer Motion](https://motion.dev/) all over the
      personal hub

### SEO (rankeamento nos motores de busca)

- [ ] Add a `robots.txt` file
- [ ] Add a `sitemap.xml` file
- [ ] Add a `humans.txt` file
- [ ] Add a `manifest.json` file

## Finalizado(s)

- [x] {2025-2-9} Plan the hero section with the main information and put on Home
      page
- [x] {2025-1-25} Configure the Blizzard API to get characters/profile info from
      World of Warcraft
  - [x] Add the `/api/blizzard/render` route to get the data render/images to
        each character
- [x] {2025-1-7} Add the `SpotifyPlayer` on the button of
      [Drawer](https://daisyui.com/components/drawer/#drawer)
- [x] {2025-1-7} Add a SVG logo without background/transparent for the
      **favicon**
  - [x] Add a **favicon** for dark and light mode
- [x] {2025-1-1} Social media and contact icons (LinkedIn, GitHub, WhatsApp,
      etc.)
- [x] {2024-12-??} Add a custom `loading.tsx` component

## Recursos utilizados

- Nix - <https://nixos.org/>
  - Ambiente de desenvolvimento reproduzível (`nix develop`)
- Vercel - <https://vercel.com/>
  - Hosting
  - Deployments
  - Analytics
  - Speed Insights
- Supabase - <https://supabase.com/>
  - Database
  - Edge Functions - <https://supabase.com/docs/guides/functions/quickstart>
    - Managing Environment Variables -
      <https://supabase.com/docs/guides/functions/secrets>
    - Deno - <https://deno.com/> (Consegui configurar o ambiente para rodar o
      Deno com os types)
  - CLI (use: `pnpm supabase`)

## Contato

- **Email**: [dev.victorferreira@gmail.com](mailto:dev.victorferreira@gmail.com)
- **LinkedIn**:
  [linkedin.com/in/victorferreira](https://www.linkedin.com/in/victorferreira)
- **Twitter**: [twitter.com/v1cferr](https://twitter.com/v1cferr)

## Licença

Este projeto está licenciado sob a Licença PHL. Veja o arquivo
[LICENSE](LICENSE) para mais detalhes.
