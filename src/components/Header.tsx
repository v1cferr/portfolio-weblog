"use client";

import { DropdownMenu } from "@/components/Header/DropdownMenu";
import LanguageSelector from "@/components/i18n/LanguageSelector";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import ThemeToggle from "@/components/ThemeToggle";
import { menuData } from "@/data/MenuData";
import { Link } from "@/i18n/routing";

import Logo from "/public/v1cferr-logo.svg";

/**
 *
 */
function Header() {
  const menus = menuData;

  return (
    <header className="navbar fixed top-0 left-0 right-0 backdrop-blur z-50 text-base-content bg-background/95 supports-[backdrop-filter]:bg-background/60">
      {/* Navbar da esquerda */}
      <div className="navbar-start gap-x-0.5">
        <Link href="/">
          <Logo className="btn-ghost btn-sm rounded-md w-14 h-auto px-1" />
        </Link>

        {/* Drawer para navegação em telas menores */}
        <div className="drawer">
          <input className="drawer-toggle" id="my-drawer" type="checkbox" />
          <div className="drawer-content">
            {/* Botão para abrir o drawer */}
            <label
              className="btn btn-sm btn-ghost lg:hidden"
              htmlFor="my-drawer">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 6h16M4 12h8m-8 6h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </label>
          </div>

          {/* Container do drawer quando está ativo */}
          <div className="drawer-side">
            <label
              aria-label="close sidebar"
              className="drawer-overlay"
              htmlFor="my-drawer"
            />
            <div className="flex flex-col min-h-full w-auto max-w-xs bg-base-200 p-4 rounded-r-box">
              <ul className="menu flex-grow w-auto">
                {menus.map((menu, index) => (
                  <DropdownMenu
                    items={menu.items}
                    key={index}
                    title={menu.title}
                  />
                ))}
              </ul>

              {/* SpotityPlayer na parte inferior */}
              <div className="flex-none">
                <SpotifyPlayer />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar central */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal gap-x-7">
          {menus.map((menu, index) => (
            <DropdownMenu items={menu.items} key={index} title={menu.title} />
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
