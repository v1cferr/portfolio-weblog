import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

import type { Locale } from "@/i18n/routing";

/**
 * The flag of a locale's region (pt-br shows Brazil's), from public/flags/,
 * which `pnpm icons:sync` copies out of circle-flags: round, to match the
 * site's pills and glass (chosen on 2026-10-23). Decorative: whatever holds it
 * carries the language's name.
 */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <Image
      src={`/flags/${locale.split("-")[1] ?? ""}.svg`}
      alt=""
      width={18}
      height={18}
      unoptimized
      className={cn("size-4.5 shrink-0 rounded-full ring-1 ring-foreground/15", className)}
    />
  );
}
