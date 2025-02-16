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

```plaintext
.
├── .devcontainer/
├── .github/
├── .vscode/
├── public/
│   ├── languages/
├── src/
│   ├── app/
│   ├── components/
│   ├── i18n/
│   ├── styles/
│   ├── utils/
│   └── middleware.ts
├── supabase/
├── ...
└── README.md
```

## Features

- 🌐 Suporte a múltiplos idiomas
- 🎨 Temas claros e escuros
- 📱 Design responsivo
- 🚀 Desempenho otimizado
- 📊 Integração com APIs externas (Blizzard, Spotify)

## Roadmap (melhorias)

- [ ] View Transition - <https://github.com/shuding/next-view-transitions>
- [ ] Uses `.mdx` files for blog posts - [Markdown and MDX](hhttps://nextjs.org/docs/app/building-your-application/configuring/mdx) **or:**
- [ ] Add a CMS - [Strapi](https://strapi.io/integrations/nextjs-cms)
- [ ] Customize the `404` page for `[locate]` and non-existent intl routes
- [ ] A ~~another~~ little badge for WIP things (like pages that are not ready yet)
- [ ] Add copyright and license (I made it but with so many resources)
- [ ] Add two buttons: to report a bug and/or suggest a feature
- [ ] Add a button to fast contact (work with me), someway to contact and/or download the resume-CV
- [ ] Weblog? (Posts, guides, tutorials, etc)
- [ ] Add the [roadmap.sh](https://roadmap.sh) in the "conhecimento" page
- [ ] Add a vertical reverse chronological timeline (resume-CV) using DaisyUI
- [ ] Add a "Projects" page with the projects I've worked on (Frontendmentor, XGuardian, etc)
- [ ] Add the data API requests to Google Spreadsheets (VSCode Extensions, WoW Addons, etc)

### SEO (rankeamento nos motores de busca)

- [ ] Add a `robots.txt` file
- [ ] Add a `sitemap.xml` file
- [ ] Add a `humans.txt` file
- [ ] Add a `manifest.json` file

## Finalizado(s)

- [x] {2025-2-9} Plan the hero section with the main information and put on Home page
- [x] {2025-1-25} Configure the Blizzard API to get characters/profile info from World of Warcraft
  - [x] Add the `/api/blizzard/render` route to get the data render/images to each character
- [x] {2025-1-7} Add the `SpotifyPlayer` on the button of [Drawer](https://daisyui.com/components/drawer/#drawer)
- [x] {2025-1-7} Add a SVG logo without background/transparent for the **favicon**
  - [x] Add a **favicon** for dark and light mode
- [x] {2025-1-1} Social media and contact icons (LinkedIn, GitHub, WhatsApp, etc.)
- [x] {2024-12-??} Add a custom `loading.tsx` component

## Recursos utilizados

- Docker - <https://www.docker.com/>
  - Containerization
  - Development
- Vercel - <https://vercel.com/>
  - Hosting
  - Deployments
  - Analytics
  - Speed Insights
- Supabase - <https://supabase.com/>
  - Database
  - Edge Functions - <https://supabase.com/docs/guides/functions/quickstart>
    - Managing Environment Variables - <https://supabase.com/docs/guides/functions/secrets>
    - Deno - <https://deno.com/> (Consegui configurar o ambiente para rodar o Deno com os types)
  - CLI (use: `pnpm supabase`)

## Contato

- **Email**: [dev.victorferreira@gmail.com](mailto:dev.victorferreira@gmail.com)
- **LinkedIn**: [linkedin.com/in/victorferreira](https://www.linkedin.com/in/victorferreira)
- **Twitter**: [twitter.com/v1cferr](https://twitter.com/v1cferr)

## Licença

Este projeto está licenciado sob a Licença PHL. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
