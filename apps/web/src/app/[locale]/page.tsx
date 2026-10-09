import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("Home");
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
    </main>
  );
}
