export const menuData = [
  {
    title: "Profissional", // Documentação da minha vida profissional
    items: [
      // { label: "DevTests", href: "/test" }, // Apenas para testes de routing, template de novas pages e outros
      {
        label: "Projetos",
        subItems: [
          { label: "Portfolio", href: "/portfolio", wip: true }, // O porquê e a construção do portfolio-weblog
          { label: "Linha do Tempo", href: "/timeline", wip: true }, // Linha do tempo de projetos (ordem cronológica inversa)
        ],
      },
      { label: "Carreira", href: "/career", wip: false }, // Linha do tempo e detalhes de cargos + atribuições (ordem cronológica inversa) - um CV praticamente + o quê aprendi com cada experiência
      { label: "Logotipo", href: "/logo", wip: true }, // Conceito e significado do logotipo
      { label: "Metas", href: "/goals", wip: false }, // Metas e objetivos profissionais (curto, médio e longo prazo)
      { label: "Inspirações", href: "/inspirations", wip: true }, // Inspirações e referências profissionais (e.g.: pessoas, empresas, projetos, etc.)
    ],
  },
  {
    title: "Conhecimento", // Documentação do meu conhecimento
    items: [
      {
        label: "Organização",
        subItems: [
          { label: "Obsidian", href: "/obsidian", wip: true }, // Como organizei meu vault
          { label: "AI & LLMs", href: "/ai-llms", wip: true }, // Como utilizo os modelos
          { label: "VS Code", href: "/vscode", wip: false }, // Extensões, temas e configurações
        ],
      },
      { label: "Graduação", href: "/graduation", wip: true }, // Detalhes da graduação em GTI
      { label: "Certificações", href: "/certifications", wip: true }, // Alura, Udemy, Hackers do Bem, etc.
      { label: "Treinamentos", href: "/trainings", wip: true }, // Treinamentos e bootcamps
      { label: "Publicações", href: "/publications", wip: true }, // Artigos, posts, etc. (ainda pensando se coloco o weblog a parte)
      { label: "Idiomas", href: "/languages", wip: true }, // Níveis de proficiência, certificados e estudos (adicionar iframe do Duolingo)
    ],
  },
  {
    title: "Pessoal", // Documentação da minha vida pessoal
    items: [
      {
        label: "Hardware",
        subItems: [
          // Adicionar sobre o Arch Linux e meus dotfiles? (Atualmente dualboot: Windows 11 + Arch Linux [Hyprland & Docker])
          // No setup, colocar os upgrades que pretendo fazer (e.g.: RTX 3080, Ryzen 9 5900X, 64GB RAM, etc.)
          { label: "Setup", href: "/setup", wip: false }, // Meu workstation; lugarzin do coração <3
          { label: "Servidor", href: "/server", wip: true }, // Ainda pretendo montar um servidor pessoal (soberania dos dados?)
        ],
      },
      {
        label: "Jogos",
        subItems: [
          { label: "World of Warcraft", href: "/wow", wip: false }, // Addons do wowzin + outros
          { label: "League of Legends", href: "/league", wip: true }, // Conta e histórico (legado)
        ],
      },
      { label: "Experiências", href: "/experiences", wip: true }, // Experiências pessoais
      { label: "Opiniões", href: "/opinions", wip: true }, // Opiniões, críticas e pontos de vista
      { label: "Ideologia", href: "/ideologies", wip: true }, // Ideologias (políticas), crenças e valores
      { label: "Agradecimentos", href: "/thanks", wip: false }, // Agradecimentos e menções honrosas
    ],
  },
];
