import { FileCodeIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { sourceUrl } from "@/lib/site";

/** Links a page to the exact content file it renders, as evidence. */
export async function SourceLink({ file }: { file: string | undefined }) {
  if (file === undefined) return null;
  const t = await getTranslations("Common");
  return (
    <a
      href={sourceUrl(file)}
      title={t("sourceHint")}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <FileCodeIcon className="size-3.5" aria-hidden />
      <span className="sr-only">{t("source")}: </span>
      content/{file}
    </a>
  );
}
