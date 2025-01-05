"use client";

import Logo from "../../public/v1cferr-logo.svg";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { DropdownMenu } from "@/components/Header/DropdownMenu";
import { Link } from "@/i18n/routing";

function Header() {
  const menus = [
    {
      title: "Profissional", // Documentação da minha vida profissional
      items: [
        { label: "Sobre", href: "/about" }, // Apenas para testes de navegação/routing
        {
          label: "Projetos",
          subItems: [
            { label: "Portfolio", href: "/portfolio" }, // O porquê e a construção do portfolio-weblog
            { label: "Linha do Tempo", href: "/timeline" }, // Linha do tempo de projetos (ordem cronológica inversa)
          ],
        },
        { label: "Carreira", href: "/career" }, // Linha do tempo e detalhes de cargos + atribuições
        { label: "Logotipo", href: "/logo" }, // Concepção e significado do logotipo
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
          ],
        },
        { label: "Graduação", href: "/graduation" }, // Detalhes da graduação em GTI
        { label: "Certificações", href: "/certifications" }, // Alura, Hackers do Bem, etc.
        { label: "Treinamentos", href: "/trainings" }, // Treinamentos e bootcamps
        { label: "Publicações", href: "/publications" }, // Artigos, posts, etc. (ainda pensando se coloco o weblog a parte)
        { label: "Idiomas", href: "/languages" }, // Níveis de proficiência, certificados e estudos (adicionar iframe do Duolingo)
      ],
    },
    {
      title: "Pessoal", // Documentação da minha vida pessoal
      items: [
        {
          label: "Equipamentos",
          subItems: [
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
        { label: "Agradecimentos", href: "/thanks" }, // Agradecimentos e menções honrosas
      ],
    },
  ];

  return (
    <header className="navbar fixed top-0 left-0 right-0 backdrop-blur z-50">
      {/* Navbar da esquerda */}
      <div className="navbar-start gap-x-0.5">
        <Link href="/">
          <Logo className="btn-ghost btn-sm rounded-md w-14 h-auto px-1" />
        </Link>

        {/* Dropdown para navegação em dispositivos com telas menores */}
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-sm btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            {menus.map((menu, index) => (
              <DropdownMenu key={index} title={menu.title} items={menu.items} />
            ))}
          </ul>
        </div>
      </div>

      {/* Navbar central */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal gap-x-2.5">
          {menus.map((menu, index) => (
            <DropdownMenu key={index} title={menu.title} items={menu.items} />
          ))}
        </ul>
      </div>

      {/* Navbar da direita */}
      <div className="navbar-end gap-x-5 mr-2.5">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
