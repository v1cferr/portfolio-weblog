"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function VSCode() {
  const t = useTranslations("VSCode");
  const locale = useLocale();
  const [sheetData, setSheetData] = useState<string[][]>([]);

  async function fetchData() {
    const response = await fetch("/api/google/sheets");

    if (response.ok) {
      const data = await response.json();
      setSheetData(data.data || []);
    } else {
      console.error(
        "Erro ao buscar os dados do Google Sheets:",
        response.statusText
      );
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const headers = [
    t("table.id"),
    t("table.name"),
    t("table.url"),
    t(`table.description`),
  ];

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>

      <div className="overflow-x-auto p-8">
        <table className="table w-full border-collapse border">
          <thead>
            <tr>
              {headers.map((header: string, index: number) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.slice(1).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row
                  .map((cell: string, colIndex: number) => (
                    <td key={colIndex}>{cell}</td>
                  ))
                  .filter(
                    (_, colIndex) =>
                      colIndex < 3 ||
                      sheetData[0][colIndex] === `Description_${locale}`
                  )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
