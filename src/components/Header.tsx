"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../../public/v1cferr-logo.svg";
import LanguageSelector from "./i18n/LanguageSelector";
import ThemeToggle from "./ThemeToggle";

function Header() {
  // Estado para controlar se o menu está aberto ou fechado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Função para abrir/fechar menu
  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  return (
    <header className="navbar">
      {/* Navbar extrema-esquerda */}
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
            <li>
              <a>Item 1</a>
            </li>
            <li>
              <a>Parent</a>
              <ul className="p-2">
                <li>
                  <a>Submenu 1</a>
                </li>
                <li>
                  <a>Submenu 2</a>
                </li>
              </ul>
            </li>
            <li>
              <a>Item 3</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Navbar central (do meio) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {/* Seção para tópicos profissionais */}
          <li>
            <details>
              <summary>Profissional</summary>
              <ul className="p-2">
                <li>
                  <a>Projetos</a>
                </li>
                <li>
                  <a>Carreira</a>
                </li>
                <li>
                  <a>Linha do Tempo</a>
                </li>
              </ul>
            </details>
          </li>

          {/* Seção para tópicos pessoais */}
          <li>
            <details>
              <summary>Pessoal</summary>
              <ul className="p-2">
                <li>
                  <details>
                    <summary>Jogos</summary>
                    <ul className="p-2">
                      <li>
                        <a>World of Warcraft</a>
                      </li>
                      <li>
                        <a>League of Legends</a>
                      </li>
                    </ul>
                  </details>
                </li>{" "}
                <li>
                  <a>Experiências</a>
                </li>
              </ul>
            </details>
          </li>

          {/* Seção para tópicos acadêmicos */}
          <li>
            <details>
              <summary>Acadêmico</summary>
              <ul className="p-2">
                <li>
                  <a>Graduação</a>
                </li>
                <li>
                  <a>Pós-Graduação</a>
                </li>
                <li>
                  <a>Publicações</a>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>

      {/* Navbar extrema-direita */}
      <div className="navbar-end gap-x-5 mr-2.5">
        <LanguageSelector />
        <ThemeToggle />
        {/* <a className="btn">Button</a> */}
      </div>
    </header>
  );
}

export default Header;
