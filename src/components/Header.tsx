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

        {/* Dropdown para navegação em telas menores */}
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
