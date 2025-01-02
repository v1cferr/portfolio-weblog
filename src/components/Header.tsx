"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../../public/v1cferr-logo.svg";

function Header() {
  // Estado para controlar se o menu está aberto ou fechado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Função para abrir/fechar menu
  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  return (
    <header className="shadow-md fixed w-full top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logotipo */}
        <div className="text-lg font-bold">
          <Link href="/">
            <Logo className="w-10 h-10" />
          </Link>
        </div>

        {/* Menu Hamburger */}
        <button
          className="p-2 rounded-md outline-none"
          aria-label="Open Menu"
          onClick={toggleMenu} // Função para abrir/fechar menu
        >
          ☰
        </button>
      </div>

      {/* Menu Expandido */}
      <nav
        className={`${
          isMenuOpen ? "block" : "hidden"
        } w-full md:flex md:items-center md:justify-between`}>
        <ul className="flex flex-col items-center md:flex-row md:space-x-4">
          <li>
            {/* TODO: usar o Link do Next para os anchor elements */}
            <a href="#" className="block py-2">
              Test 0
            </a>
          </li>
          <li>
            <a href="#" className="block py-2">
              Test 1
            </a>
          </li>
          <li>
            <a href="#" className="block py-2">
              Test 2
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;