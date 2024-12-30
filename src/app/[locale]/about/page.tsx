import React from "react";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/i18n/LanguageSelector";

const About = () => {
  const t = useTranslations("About");

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>

      <LanguageSelector />
    </>
  );
};

export default About;
