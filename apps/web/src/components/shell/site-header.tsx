import { getLocale, getTranslations } from "next-intl/server";

import { NAV_SECTION } from "@/components/page-transition";
import { NowPlayingChip } from "@/features/profile/now-playing-chip";
import { SearchDialog } from "@/features/search/search-dialog";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { buildExplorerTree } from "@/lib/explorer-tree";

import { ExplorerSheet } from "./explorer-sheet";
import { LocaleSwitcher } from "./locale-switcher";
import { MainNav, MobileNav } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  // The site as a file tree: the "~/" panel from lg up, a section of the menu below (no room for one more button
  // next to the now-playing chip at 360px).
  const explorer = await buildExplorerTree(await getLocale());
  // Named for view transitions, so it stays still while the page content moves
  // (see the page-transition rules in globals.css). The header itself is a
  // transparent strip that lets clicks through; the bar is a floating glass
  // pill inside it, with the page passing blurred underneath (option H1,
  // picked on 2026-11-22).
  return (
    <header
      // The ::before band fades the page out above the pill, so text scrolling up does not show in the gap.
      className="pointer-events-none sticky top-0 z-40 px-3 pt-3 before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-8 before:bg-linear-to-b before:from-background before:to-transparent sm:px-4"
    >
      <a
        href="#content"
        className="pointer-events-auto sr-only rounded-full bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        {t("skipToContent")}
      </a>
      <div
        className="glass-float pointer-events-auto mx-auto flex h-13 max-w-6xl items-center gap-4 rounded-full pr-2 pl-4 sm:pl-5"
        // Named here, not on <header>: a view-transition-name makes its element a backdrop root, so on the header the
        // pill's backdrop-filter would blur only the header's own transparent box and the page would show through sharp.
        style={{ viewTransitionName: "site-header" }}
      >
        <Link
          href="/"
          transitionTypes={NAV_SECTION}
          className="-m-1 rounded-lg p-1 transition-opacity hover:opacity-80"
          aria-label={t("brandHome")}
        >
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-1 lg:ml-6 lg:flex-1">
          <MainNav />
          {/* Mobile first: 40px touch targets on phones and tablets, the compact desktop sizes from lg up. */}
          <div className="ml-auto flex items-center gap-1">
            <ExplorerSheet tree={explorer} />
            <NowPlayingChip />
            <SearchDialog />
            <LocaleSwitcher />
            <ThemeToggle />
            <MobileNav explorer={explorer} />
          </div>
        </div>
      </div>
    </header>
  );
}
