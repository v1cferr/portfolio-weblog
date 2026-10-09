import { getTranslations } from "next-intl/server";

import { SearchDialog } from "@/features/search/search-dialog";
import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";
import { MainNav, MobileNav } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <a
        href="#content"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight" aria-label={t("home")}>
          v1cferr<span className="text-lane-career">.dev</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 lg:ml-6 lg:flex-1">
          <MainNav />
          <div className="ml-auto flex items-center gap-1">
            <SearchDialog />
            <LocaleSwitcher />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
