import { describe, expect, it } from "vitest";

import { isOrdered, lowerBound, upperBound } from "../src";

describe("partial dates", () => {
  it("expands to the widest range the precision allows", () => {
    expect(lowerBound("2023")).toBe("2023-01-01");
    expect(upperBound("2023")).toBe("2023-12-31");
    expect(upperBound("2024-02")).toBe("2024-02-29");
    expect(upperBound("2023-02")).toBe("2023-02-28");
    expect(upperBound("2023-02-10")).toBe("2023-02-10");
  });

  it("orders ranges by precision-aware bounds", () => {
    expect(isOrdered("2023-07", "2023")).toBe(true);
    expect(isOrdered("2023-07", "2023-06")).toBe(false);
  });
});
