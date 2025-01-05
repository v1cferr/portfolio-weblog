import { useTranslations } from "next-intl";

export default function WorldOfWarcraft() {
  const t = useTranslations("WorldOfWarcraft");

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </>
  );
}
