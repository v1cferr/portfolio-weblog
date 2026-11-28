import { test } from "@playwright/test";

/**
 * An axe audit runs once per theme instead of once per theme and viewport:
 * light in the mobile project, dark in the desktop one. Every theme and every
 * viewport is still audited, at half the runs. Call it first in a test that
 * loops over both themes and runs in both projects; a test pinned to one
 * project keeps both themes.
 */
export function auditThemeOnce(theme: "light" | "dark") {
  const mobile = test.info().project.name === "mobile";
  test.skip(mobile !== (theme === "light"), `the ${theme} theme is audited in the ${theme === "light" ? "mobile" : "desktop"} project`);
}
