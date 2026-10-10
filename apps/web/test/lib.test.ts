import { describe, expect, it } from "vitest";

import en from "../messages/en-us.json";
import pt from "../messages/pt-br.json";
import zh from "../messages/zh-cn.json";
import { withFallback } from "../src/i18n/messages";
import { currentMonth, formatPartialDate, monthsBetween } from "../src/lib/dates";
import { languageAlternates, languageTag } from "../src/lib/i18n";

describe("formatPartialDate", () => {
  it("keeps the precision of the source", () => {
    expect(formatPartialDate("2023", "en-us")).toBe("2023");
    expect(formatPartialDate("2023-07", "en-us")).toBe("Jul 2023");
    expect(formatPartialDate("2023-07-15", "en-us")).toBe("Jul 15, 2023");
  });

  it("never shifts the day across time zones", () => {
    expect(formatPartialDate("2024-01-01", "pt-br")).toBe("1 de jan. de 2024");
  });
});

describe("monthsBetween", () => {
  it("counts both the first and the last month", () => {
    expect(monthsBetween("2023-07", "2023-12")).toBe(6);
    expect(monthsBetween("2021-03", "2022-08")).toBe(18);
  });

  it("refuses to guess with year-only dates", () => {
    expect(monthsBetween("2023", "2024-02")).toBeUndefined();
  });

  it("formats the current month", () => {
    expect(currentMonth(new Date(Date.UTC(2026, 9, 9)))).toBe("2026-10");
  });
});

describe("i18n helpers", () => {
  it("builds BCP 47 tags and hreflang maps", () => {
    expect(languageTag("pt-br")).toBe("pt-BR");
    expect(languageAlternates("/career")).toEqual({
      "en-US": "/en-us/career",
      "pt-BR": "/pt-br/career",
      "zh-CN": "/zh-cn/career",
      "x-default": "/en-us/career",
    });
  });
});

describe("message catalogues", () => {
  const keys = (messages: object, prefix = ""): string[] =>
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === "object" && value !== null ? keys(value as object, `${prefix}${key}.`) : [`${prefix}${key}`]
    );

  it("pt-br translates every key and adds none", () => {
    expect(keys(pt).sort()).toEqual(keys(en).sort());
  });

  it("zh-cn only contains keys that exist in English", () => {
    const english = new Set(keys(en));
    expect(keys(zh).filter((key) => !english.has(key))).toEqual([]);
  });

  it("falls back to English for missing zh-cn keys without dropping reviewed ones", () => {
    const merged = withFallback(en, zh) as typeof en;
    expect(merged.LocaleSwitcher.label).toBe(zh.LocaleSwitcher.label);
    expect(merged.Nav.career).toBe(en.Nav.career);
    expect(keys(merged).sort()).toEqual(keys(en).sort());
  });
});
