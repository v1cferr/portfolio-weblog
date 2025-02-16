// TODO: Adicionar um atributo "wip: boolean" para cada item do menuData + icon e/ou modal de WIP
export const menuData = [
  {
    title: "Profissional", // Documentação da minha vida profissional
    items: [
      // { label: "DevTests", href: "/test" }, // Apenas para testes de routing, template de novas pages e outros
      {
        label: "Projetos",
        subItems: [
          { label: "Portfolio", href: "/portfolio" }, // O porquê e a construção do portfolio-weblog
          { label: "Linha do Tempo", href: "/timeline" }, // Linha do tempo de projetos (ordem cronológica inversa)
        ],
      },
      { label: "Carreira", href: "/career" }, // Linha do tempo e detalhes de cargos + atribuições (ordem cronológica inversa) - um CV praticamente + o quê aprendi com cada experiência
      { label: "Logotipo", href: "/logo" }, // Concepção e significado do logotipo
      { label: "Metas", href: "/goals" }, // Metas e objetivos profissionais (curto, médio e longo prazo)
    ],
  },
  {
    title: "Conhecimento", // Documentação do meu conhecimento
    items: [
      {
        label: "Organização",
        subItems: [
          { label: "Obsidian", href: "/obsidian" }, // Como organizei meu vault
          { label: "AI & LLMs", href: "/ai-llms" }, // Como utilizo os modelos
          { label: "VS Code", href: "/vscode" }, // Extensões, temas e configurações
        ],
      },
      { label: "Graduação", href: "/graduation" }, // Detalhes da graduação em GTI
      { label: "Certificações", href: "/certifications" }, // Alura, Udemy, Hackers do Bem, etc.
      { label: "Treinamentos", href: "/trainings" }, // Treinamentos e bootcamps
      { label: "Publicações", href: "/publications" }, // Artigos, posts, etc. (ainda pensando se coloco o weblog a parte)
      { label: "Idiomas", href: "/languages" }, // Níveis de proficiência, certificados e estudos (adicionar iframe do Duolingo)
    ],
  },
  {
    title: "Pessoal", // Documentação da minha vida pessoal
    items: [
      {
        label: "Tecnologia",
        subItems: [
          // Adicionar sobre o Arch Linux e meus dotfiles? (Atualmente dualboot: Windows 11 + Arch Linux [Hyprland & Docker])
          // No setup, colocar os upgrades que pretendo fazer (e.g.: RTX 3080, Ryzen 9 5900X, 64GB RAM, etc.)
          { label: "Meu Setup", href: "/setup" }, // Meu workstation; lugarzin do coração <3
          { label: "Servidor", href: "/server" }, // Ainda pretendo montar um servidor pessoal (soberania dos dados?)
        ],
      },
      {
        label: "Jogos",
        subItems: [
          { label: "World of Warcraft", href: "/wow" }, // Addons do wowzin + outros
          { label: "League of Legends", href: "/lol" }, // Conta e histórico (legado)
        ],
      },
      { label: "Experiências", href: "/experiences" }, // Experiências pessoais
      { label: "Opiniões", href: "/opinions" }, // Opiniões, críticas e pontos de vista
      { label: "Ideologia", href: "/ideologies" }, // Ideologias (políticas), crenças e valores
      { label: "Agradecimentos", href: "/thanks" }, // Agradecimentos e menções honrosas
    ],
  },
];
