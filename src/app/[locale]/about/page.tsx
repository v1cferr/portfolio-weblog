import React from "react";
import { useTranslations } from "next-intl";

const About = () => {
  const t = useTranslations("About");

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </>
  );
};

export default About;
