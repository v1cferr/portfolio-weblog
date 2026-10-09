"use client";

import { Button } from "@workspace/ui/components/button";
import { useTranslations } from "next-intl";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Error");
  return (
    <div role="alert" className="max-w-xl py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("description")}</p>
      <Button className="mt-8" onClick={reset}>
        {t("retry")}
      </Button>
    </div>
  );
}
