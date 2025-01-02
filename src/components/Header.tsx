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
    // <header className="shadow-md fixed w-full top-0 z-50">
    //   <div className="flex items-center justify-between px-4 py-3">
    //     {/* Logotipo */}
    //     <div className="text-lg font-bold">
    //       <Link href="/">
    //         <Logo className="w-10 h-10" />
    //       </Link>
    //     </div>

    //     {/* Menu Hamburger */}
    //     <button
    //       className="p-2 rounded-md outline-none"
    //       aria-label="Open Menu"
    //       onClick={toggleMenu} // Função para abrir/fechar menu
    //     >
    //       ☰
    //     </button>
    //   </div>

    //   {/* Menu Expandido */}
    //   <nav
    //     className={`${
    //       isMenuOpen ? "block" : "hidden"
    //     } w-full md:flex md:items-center md:justify-between`}>
    //     <ul className="flex flex-col items-center md:flex-row md:space-x-4">
    //       <li>
    //         {/* TODO: usar o Link do Next para os anchor elements */}
    //         <a href="#" className="block py-2">
    //           Test 0
    //         </a>
    //       </li>
    //       <li>
    //         <a href="#" className="block py-2">
    //           Test 1
    //         </a>
    //       </li>
    //       <li>
    //         <a href="#" className="block py-2">
    //           Test 2
    //         </a>
    //       </li>
    //     </ul>
    //   </nav>
    // </header>

    // TODO: Header + Navbar com DaisyUI - Seguir com o template
    // https://daisyui.com/components/navbar/
    <header className="navbar fixed bg-base-100 shadow-md">
      {/* Navbar extrema-esquerda */}
      <div className="navbar-start gap-x-0.5">
        {/* Logo e/ou nome no canto superior esquerdo */}
        <Link href="/">
          <Logo className="btn-ghost btn-sm rounded-md w-16 h-auto" />
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
          <li>
            <a>Item 1</a>
          </li>
          <li>
            <details>
              <summary>Parent</summary>
              <ul className="p-2">
                <li>
                  <a>Submenu 1</a>
                </li>
                <li>
                  <a>Submenu 2</a>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <a>Item 3</a>
          </li>
        </ul>
      </div>

      {/* Navbar extrema-direita */}
      <div className="navbar-end gap-x-2.5">
        <LanguageSelector />
        <ThemeToggle />
        {/* <a className="btn">Button</a> */}
      </div>
    </header>
  );
}

export default Header;
