"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
            <Image
              src="/v1cferr-logo.png"
              width={40}
              height={40}
              alt="v1cferr Logo"
            />
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
        } w-full lg:flex lg:items-center lg:justify-between`}>
        <ul className="flex flex-col items-center lg:flex-row lg:space-x-4">
          <li>
            <a href="#about" className="block py-2">
              Sobre
            </a>
          </li>
          <li>
            <a href="#projects" className="block py-2">
              Projetos
            </a>
          </li>
          <li>
            <a href="#contact" className="block py-2">
              Contato
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
