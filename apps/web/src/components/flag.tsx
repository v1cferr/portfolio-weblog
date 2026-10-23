import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

import type { Locale } from "@/i18n/routing";

/**
 * The flag of a locale's region (pt-br shows Brazil's), from public/flags/,
 * which `pnpm icons:sync` copies out of flag-icons. In its own 4:3 shape with
 * rounded corners, the most legible of the three tried on 23/10/2026.
 * Decorative: whatever holds it carries the language's name.
 */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <Image
      src={`/flags/${locale.split("-")[1] ?? ""}.svg`}
      alt=""
      width={20}
      height={15}
      unoptimized
      className={cn("shrink-0 rounded-[3px] object-cover ring-1 ring-foreground/15", className)}
    />
  );
}
