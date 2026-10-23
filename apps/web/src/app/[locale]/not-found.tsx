import { Button } from "@workspace/ui/components/button";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <div className="max-w-xl py-16">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      <Button asChild className="mt-8">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
