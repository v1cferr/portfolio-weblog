import { useTranslations } from "next-intl";

const Test = () => {
  const t = useTranslations("Test");

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </>
  );
};

export default Test;
