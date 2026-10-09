{
  description = "Development environment for portfolio-weblog, the pnpm monorepo behind v1cferr.dev";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            # Node 22 is the runtime Vercel builds this project with, so the
            # local toolchain matches what production actually runs.
            pkgs.nodejs_22

            # Pinned to the major that matches pnpm-lock.yaml (lockfileVersion
            # 9.0); the workspace is managed by pnpm only.
            pkgs.pnpm_10
          ];

          # Browsers for the Playwright smoke tests. Downloaded browsers do not
          # run on NixOS, so they come from nixpkgs, and @playwright/test in
          # apps/web is pinned to the same version (playwright-driver.version).
          PLAYWRIGHT_BROWSERS_PATH = pkgs.playwright-driver.browsers;
          PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";

          # Only greet on an interactive shell: `nix develop --command` pipes
          # stdout into other tools, and a banner there corrupts their input.
          shellHook = ''
            if [ -t 1 ]; then
              echo "portfolio-weblog: node $(node --version), pnpm $(pnpm --version)"
            fi
          '';
        };
      });
    };
}
