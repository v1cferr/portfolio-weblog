import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { EyeIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Shown on content in `review`, which only preview deployments render
 * (ADR 0019): the owner reading it knows it is not live yet.
 */
export async function ReviewNotice() {
  const t = await getTranslations("Common");
  return (
    <Alert className="mb-8" data-testid="review-notice">
      <EyeIcon />
      <AlertDescription>{t("reviewNotice")}</AlertDescription>
    </Alert>
  );
}
