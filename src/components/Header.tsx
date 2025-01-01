"use client";

import { useState } from "react";
import Link from "next/link";

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
          <Link href="/">V1CFERR</Link>
        </div>

        {/* Menu Hamburger */}
        <button
          className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 lg:hidden"
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
        } bg-white w-full lg:flex lg:items-center lg:justify-between`}>
        <ul className="flex flex-col items-center lg:flex-row lg:space-x-4">
          <li>
            <a
              href="#about"
              className="block py-2 text-gray-700 hover:text-gray-900">
              Sobre
            </a>
          </li>
          <li>
            <a
              href="#projects"
              className="block py-2 text-gray-700 hover:text-gray-900">
              Projetos
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className="block py-2 text-gray-700 hover:text-gray-900">
              Contato
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
