/*
 * The page background (direction B, picked on 2026-11-22): a faint dot grid on
 * a 60° (hexagonal) lattice, the geometry of the NixOS snowflake, fading out
 * from the top of the viewport. CSS only: no image, no client code. The
 * content surfaces above it are nearly transparent and catch the pointer
 * spotlight (see .glass in globals.css and components/motion/spotlight.tsx).
 */
export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(120%_80%_at_50%_0%,#000,transparent_75%)] [background-image:radial-gradient(color-mix(in_srgb,var(--foreground)_22%,transparent)_1px,transparent_1.4px),radial-gradient(color-mix(in_srgb,var(--foreground)_22%,transparent)_1px,transparent_1.4px)] [background-position:0_0,12px_20.78px] [background-size:24px_41.57px]"
    />
  );
}
