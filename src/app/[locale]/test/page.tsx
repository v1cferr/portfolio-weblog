import { useTranslations } from "next-intl";
import Link from "next/link";

const Test = () => {
  const t = useTranslations("Test");

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <Link href="/api/blizzard/login">
        <button className="btn">Log In</button>
      </Link>
    </>
  );
};

export default Test;
