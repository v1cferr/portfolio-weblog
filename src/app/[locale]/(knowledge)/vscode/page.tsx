"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState, useCallback } from "react";

import Loading from "@/components/Loading";

// Link da planilha com as extensões do VSCode:
// docs.google.com/spreadsheets/d/1CT7apH_TdLH-tlwjsT9B9-8cCPYKYkkV7GbyFVLfE0g/edit?gid=906698806#gid=906698806

/**
 *
 */
export default function VSCode() {
  const t = useTranslations("VSCode");
  const locale = useLocale();
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [descriptionIndexes, setDescriptionIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const response = await fetch("/api/google/sheets");

    if (response.ok) {
      const data = await response.json();
      setSheetData(data.data ?? []);
      const indexes = data.data[0]
        .map((header: string, index: number) => (header === `Description_${locale}` ? index : -1))
        .filter((index: number) => index !== -1);
      setDescriptionIndexes(indexes);
    } else {
      console.error("Erro ao buscar os dados do Google Sheets:", response.statusText);
    }

    setLoading(false);
  }, [locale]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const headers = [
    "ID & Link", // table.idLink
    t("table.name"),
    // t("table.url"),
    t(`table.description`),
  ];

  return (
    <div className="p-4 md:p-12">
      <h1 className="text-2xl md:text-4xl font-bold mb-2">{t("title")}</h1>
      <p className="text-lg md:text-xl mb-8">{t("subtitle")}</p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading />
        </div>
      ) : (
        <>
          {/* Card para telas menores */}
          <div className="block md:hidden">
            {sheetData.slice(1).map((row: string[], rowIndex: number) => (
              <div className="card bg-base-200/50 mb-4 p-4 rounded-lg shadow-lg" key={row[0] || `row-${rowIndex}`}>
                {row
                  .filter((_, colIndex: number) => colIndex < 2 || descriptionIndexes.includes(colIndex))
                  .map((cell: string, colIndex: number) => (
                    <div className="mb-2" key={`${row[0]}-${headers[colIndex]}-${cell}`}>
                      <span className="font-semibold">{headers[colIndex]}: </span>
                      {colIndex === 0 ? (
                        <Link
                          className="underline hover:text-primary/80"
                          href={`https://marketplace.visualstudio.com/items?itemName=${cell}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {cell}
                        </Link>
                      ) : (
                        cell
                      )}
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
                    <th className={`${index === 0 ? "rounded-tl-lg" : index === headers.length - 1 ? "rounded-tr-lg" : ""}`} key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="rounded-b-lg">
                {sheetData.slice(1).map((row: string[], rowIndex: number) => (
                  <tr className="break-words hover:bg-base-200/20" key={row[0] || `row-${rowIndex}`}>
                    {row
                      .filter((_, colIndex: number) => colIndex < 2 || descriptionIndexes.includes(colIndex))
                      .map((cell: string, colIndex: number) => (
                        <td className="rounded-b-lg" key={`${row[0]}-${headers[colIndex]}`}>
                          {colIndex === 0 ? (
                            <Link
                              className="underline hover:text-primary/80"
                              href={`https://marketplace.visualstudio.com/items?itemName=${cell}`}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {cell}
                            </Link>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
