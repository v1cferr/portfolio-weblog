"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { getAuthCode } from "@/utils/getCharacters";

const Test = () => {
  const t = useTranslations("Test");

  // useEffect(() => {
  //   const authUrl = getAuthCode();
  //   console.log(authUrl);
  // }, []);

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </>
  );
};

export default Test;
