import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * Smoke tests against the production build (`pnpm build` first). Two
 * viewports: a phone and a large desktop.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI !== undefined ? 1 : 0,
  reporter: process.env.CI !== undefined ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${String(PORT)}`, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm start -p ${String(PORT)}`,
    port: PORT,
    reuseExistingServer: process.env.CI === undefined,
    timeout: 60_000,
  },
});
