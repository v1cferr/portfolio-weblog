"use client";

import Logo from "../../public/v1cferr-logo.svg";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { DropdownMenu } from "@/components/Header/DropdownMenu";
import { Link } from "@/i18n/routing";
import { menuData } from "@/components/Header/MenuData";

function Header() {
  const menus = menuData;

  return (
    <header className="navbar fixed top-0 left-0 right-0 backdrop-blur z-50">
      {/* Navbar da esquerda */}
      <div className="navbar-start gap-x-0.5">
        <Link href="/">
          <Logo className="btn-ghost btn-sm rounded-md w-14 h-auto px-1" />
        </Link>

        {/* Drawer para navegação em telas menores */}
        <div className="drawer">
          <input id="my-drawer" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">
            {/* Botão para abrir o drawer */}
            <label
              htmlFor="my-drawer"
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
            </label>
          </div>

          {/* Container do drawer quando está ativo */}
          <div className="drawer-side">
            {/* TODO: Adicionar o SpotifyPlayer posteriormente no canto inferior */}
            <label
              htmlFor="my-drawer"
              aria-label="close sidebar"
              className="drawer-overlay"
            />
            <ul className="menu bg-base-200 min-h-full w-auto p-4 rounded-r-box">
              {menus.map((menu, index) => (
                <DropdownMenu
                  key={index}
                  title={menu.title}
                  items={menu.items}
                />
              ))}
            </ul>
          </div>
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
