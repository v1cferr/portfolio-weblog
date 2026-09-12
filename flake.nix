{
  description = "Development environment for portfolio-weblog, a Next.js site deployed on Vercel";

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
            # 9.0) and still reads pnpm.onlyBuiltDependencies from package.json.
            pkgs.pnpm_10

            # supabase/functions are Deno edge functions, deployed through the
            # Supabase CLI rather than through the Next.js build.
            pkgs.deno
            pkgs.supabase-cli
          ];

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
