import { differenceInMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Calcula duração entre duas datas no formato "yyyy-MM"
 */
export function getUsageTime(start: string, end?: string): string {
  if (!start) return "";
  const startDate = parse(start, "yyyy-MM", new Date());
  const endDate = end ? parse(end, "yyyy-MM", new Date()) : new Date();
  const months = differenceInMonths(endDate, startDate);
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const yearStr = years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "";
  const monthStr = remMonths > 0 ? `${remMonths} ${remMonths > 1 ? "meses" : "mês"}` : "";
  if (yearStr && monthStr) return `${yearStr} e ${monthStr}`;
  return yearStr || monthStr || "menos de um mês";
}

/**
 * Calcula duração para datas no formato "MMM yyyy - MMM yyyy" ou "MMM yyyy - Atual"
 */
export function getTimelineDuration(dateRange: string): string {
  const [start, end] = dateRange.split(" - ");
  const startDate = parse(start, "MMM yyyy", new Date(), { locale: ptBR });
  const endDate = end === "Atual" ? new Date() : parse(end, "MMM yyyy", new Date(), { locale: ptBR });

  const months = differenceInMonths(endDate, startDate);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearString = years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "";
  const monthString = remainingMonths > 0 ? `${remainingMonths} ${remainingMonths > 1 ? "meses" : "mês"}` : "";

  if (yearString && monthString) {
    return `${yearString} e ${monthString}`;
  }

  return yearString || monthString || "menos de um mês";
}
