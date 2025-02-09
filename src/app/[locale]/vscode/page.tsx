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
    <div className="p-4 md:p-12">
      <h1 className="text-2xl md:text-4xl font-bold mb-2">{t("title")}</h1>
      <p className="text-lg md:text-xl mb-8">{t("subtitle")}</p>

      {/* Card para telas menores */}
      <div className="block md:hidden">
        {sheetData.slice(1).map((row: string[], rowIndex: number) => (
          <div
            key={rowIndex}
            className="card bg-base-200/50 mb-4 p-4 rounded-lg shadow-lg">
            {row
              .filter(
                (_, colIndex: number) =>
                  colIndex < 3 || descriptionIndexes.includes(colIndex)
              )
              .map((cell: string, colIndex: number) => (
                <div key={colIndex} className="mb-2">
                  <span className="font-semibold">{headers[colIndex]}: </span>
                  {cell}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Tabela para telas maiores */}
      <div className="hidden md:block">
        <table className="table w-full border-primary rounded-lg">
          <thead className="text-lg font-semibold text-primary bg-base-200/50 rounded-t-lg">
            <tr className="rounded-lg">
              {headers.map((header: string, index: number) => (
                <th
                  key={index}
                  className={`${
                    index === 0
                      ? "rounded-tl-lg"
                      : index === headers.length - 1
                      ? "rounded-tr-lg"
                      : ""
                  }`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="rounded-b-lg">
            {sheetData.slice(1).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} className="break-words hover:bg-base-200/20">
                {row
                  .filter(
                    (_, colIndex: number) =>
                      colIndex < 3 || descriptionIndexes.includes(colIndex)
                  )
                  .map((cell: string, colIndex: number) => (
                    <td key={colIndex} className="rounded-b-lg">
                      {cell}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
