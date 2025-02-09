"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function VSCode() {
  const t = useTranslations("VSCode");
  const locale = useLocale();
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [descriptionIndexes, setDescriptionIndexes] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    const response = await fetch("/api/google/sheets");

    if (response.ok) {
      const data = await response.json();
      setSheetData(data.data || []);
      const indexes = data.data[0]
        .map((header: string, index: number) =>
          header === `Description_${locale}` ? index : -1
        )
        .filter((index: number) => index !== -1);
      setDescriptionIndexes(indexes);
    } else {
      console.error(
        "Erro ao buscar os dados do Google Sheets:",
        response.statusText
      );
    }
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const headers = [
    t("table.id"),
    t("table.name"),
    t("table.url"),
    t(`table.description`),
  ];

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>

      <div className="overflow-x-auto p-12">
        <table className="table w-full border-primary">
          <thead className="text-lg font-semibold text-primary bg-base-200/50">
            <tr>
              {headers.map((header: string, index: number) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.slice(1).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} className="break-words hover:bg-base-200/20">
                {row
                  .filter(
                    (_, colIndex: number) =>
                      colIndex < 3 || descriptionIndexes.includes(colIndex)
                  )
                  .map((cell: string, colIndex: number) => (
                    <td key={colIndex}>{cell}</td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
