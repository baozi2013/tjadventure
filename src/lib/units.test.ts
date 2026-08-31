import { describe, expect, it } from "vitest";
import { toFeet, toMiles } from "@/lib/units";

describe("toMiles", () => {
  it("returns the value unchanged when already in miles", () => {
    expect(toMiles(50, "mi")).toBe(50);
  });

  it("converts kilometers to miles", () => {
    expect(toMiles(100, "km")).toBeCloseTo(62.1371, 3);
  });
});

describe("toFeet", () => {
  it("returns the value unchanged when already in feet", () => {
    expect(toFeet(4000, "ft")).toBe(4000);
  });

  it("converts meters to feet", () => {
    expect(toFeet(1000, "m")).toBeCloseTo(3280.84, 1);
  });
});
