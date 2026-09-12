# Overview

- **Project name**: portfolio-weblog
- **URL/domain**: <https://v1cferr.dev>
  - **Registrar**: Hostinger
- **Technologies**:
  - Next.js 16 (App Router + TypeScript)
  - Tailwind CSS
  - DaisyUI
- **Hosting (PaaS)**: Vercel
- **BaaS (backend as a service)**: Supabase

## Project structure

```bash
.
├── .envrc                   # Selects the Nix dev shell through direnv
├── .github/                 # GitHub workflows, templates and configuration
├── .vscode/                 # VS Code settings
├── public/                  # Public assets (images, favicon, ...)
│   └── languages/           # Translation files
├── src/                     # Application source
│   ├── app/                 # Next.js routes and pages (App Router)
│   │   ├── [api]/           # Custom API routes
│   │   ├── [locale]/        # Internationalised routes
│   │   │   ├── (professional)/  # Professional pages
│   │   │   ├── (knowledge)/     # Knowledge pages
│   │   │   ├── (personal)/      # Personal pages
│   │   │   ├── [...rest]/       # Catch-all for unmapped routes
│   │   │   ├── layout.tsx       # Main layout for the locale routes
│   │   │   ├── not-found.tsx    # Custom 404 page
│   │   │   └── page.tsx         # Locale home page
│   ├── components/          # Reusable React components
│   ├── i18n/                # Internationalisation setup
│   ├── styles/              # Global styles and CSS/Tailwind utilities
│   ├── utils/               # Helper functions
│   ├── types/               # Shared types
│   └── proxy.ts             # Next.js proxy (formerly middleware.ts)
├── supabase/                # Supabase configuration and schemas
├── flake.nix                # Dev shell with node, pnpm, deno and the supabase CLI
├── flake.lock               # Pinned nixpkgs revision
├── ...
└── README.md                # This document
```

## Why this stack

I picked Next.js because it is a **full-stack framework** that keeps front-end
and back-end in a single repository, which brings:

- **App Router and nested layouts**: a folder convention for routes, layouts and
  language modules, which keeps the structure organised as it grows.
- **Hybrid rendering (SSR, SSG, ISR)**:
  - **SSG** (static site generation) pre-renders HTML at build time, ideal for
    static content such as posts and personal pages.
  - **SSR** (server side rendering) serves dynamic pages on demand, so the data
    is always current.
  - **ISR** (incremental static regeneration) refreshes individual static pages
    without a full rebuild.
- **React Server Components**: logic and data fetching run on the server inside
  components, shrinking the bundle sent to the client.
- **Built-in API routes and edge functions**: REST/GraphQL endpoints live in
  `app/api` and can run as serverless functions or on the edge runtime for
  minimal latency.
- **Out-of-the-box optimisations**:
  - **Image optimisation** through the `<Image>` component, with responsive
    loading and automatic lazy loading.
  - **Font optimisation** and automatic per-route code splitting.
  - **Native proxy** for headers, authentication and redirects in one place.
- **Developer experience**:
  - **TypeScript first**: native typing, completion and safe refactoring across
    the whole codebase.
  - **Hot reload** and instant feedback while developing.
  - **Preview deploys** on Vercel: every PR gets an isolated environment on its
    own URL.
- **SEO and performance**:
  - Pre-rendered pages load faster and rank better.
  - Dynamic metadata and sitemap/robots generation with no external tooling.
- **Mature ecosystem**:
  - First-party integrations (NextAuth, tRPC, Prisma, MDX, analytics, A/B
    testing).
  - An active community and thorough documentation.
- **Monorepo and code sharing**:
  - Packages separate cleanly, and hooks, types and services are shared between
    the front-end and the API.
  - Works well with CI/CD tooling, keeping environments consistent.
- **Scalability and maintenance**:
  - A modular architecture that grows with the project.
  - Frequent releases with backward compatibility maintained by the Vercel team.

Together this makes Next.js a good fit for a personal hub (portfolio-weblog)
that has to be:

1. **Quick to build**: conventions and bundled tooling cut the setup time.
2. **Good at SEO**: SSR/SSG deliver indexing and performance.
3. **Easy to maintain**: a clear structure, typing and a monorepo keep the
   technical debt down.
4. **Ready to grow**: APIs, authentication, analytics and edge functions can be
   added as the need appears.

## Features

- 🌐 Multi-language support
- 🎨 Light and dark themes
- 📱 Responsive design
- 🚀 Optimised performance
- 📊 Integration with external APIs (Blizzard, Spotify)

## Roadmap

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
- [ ] Add the [roadmap.sh](https://roadmap.sh) in the "knowledge" page
- [ ] Add a vertical reverse chronological timeline (resume-CV) using DaisyUI
- [ ] Add a "Projects" page with the projects I've worked on (Frontendmentor,
      XGuardian, etc)
- [ ] Add the data API requests to Google Spreadsheets (VSCode Extensions, WoW
      Addons, etc)
- [ ] Add animations using [Framer Motion](https://motion.dev/) all over the
      personal hub

### SEO

- [ ] Add a `robots.txt` file
- [ ] Add a `sitemap.xml` file
- [ ] Add a `humans.txt` file
- [ ] Add a `manifest.json` file

## Done

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

## Resources used

- Nix - <https://nixos.org/>
  - Reproducible development environment (`nix develop`)
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
    - Deno - <https://deno.com/> (the environment is set up to run Deno with its
      types)
  - CLI (use: `pnpm supabase`)

## Contact

- **Email**: [dev.victorferreira@gmail.com](mailto:dev.victorferreira@gmail.com)
- **LinkedIn**:
  [linkedin.com/in/victorferreira](https://www.linkedin.com/in/victorferreira)
- **Twitter**: [twitter.com/v1cferr](https://twitter.com/v1cferr)

## License

This project is licensed under the PHL License. See the [LICENSE](LICENSE) file
for details.
