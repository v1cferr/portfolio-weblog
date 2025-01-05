"use client";

import Logo from "../../public/v1cferr-logo.svg";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { DropdownMenu } from "@/components/Header/DropdownMenu";
import { Link } from "@/i18n/routing";

function Header() {
  const menus = [
    {
      title: "Profissional",
      items: [
        { label: "Sobre", href: "/about" },
        {
          label: "Projetos",
          subItems: [
            { label: "Portfolio", href: "/portfolio" },
            { label: "Linha do Tempo", href: "/timeline" },
          ],
        },
        { label: "Carreira", href: "/career" },
        { label: "Linha do Tempo", href: "/timeline" },
      ],
    },
    {
      title: "Conhecimento",
      items: [
        {
          label: "Organização",
          subItems: [
            { label: "Obsidian", href: "/obsidian" },
            { label: "AI & LLMs", href: "/ai-llms" },
          ],
        },
        { label: "Graduação", href: "/graduation" },
        { label: "Treinamentos", href: "/trainings" },
        { label: "Publicações", href: "/publications" },
        { label: "Idiomas", href: "/languages" },
      ],
    },
    {
      title: "Pessoal",
      items: [
        {
          label: "Jogos",
          subItems: [
            { label: "World of Warcraft", href: "/wow" },
            { label: "League of Legends", href: "/lol" },
          ],
        },
        { label: "Experiências", href: "/experiences" },
        { label: "Meu Setup", href: "/setup" },
      ],
    },
  ];

  return (
    <header className="navbar sticky backdrop-blur">
      {/* Navbar da esquerda */}
      <div className="navbar-start gap-x-0.5">
        {/* Logo e/ou nome no canto superior esquerdo */}
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
