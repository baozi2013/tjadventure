import { describe, expect, it } from "vitest";
import { getLocalImageDimensions } from "@/lib/image-dimensions";

describe("getLocalImageDimensions", () => {
  it("reads intrinsic dimensions of a public image", () => {
    expect(getLocalImageDimensions("/about/tian.png")).toEqual({ width: 1080, height: 1440 });
  });

  it("ignores query strings and hashes", () => {
    expect(getLocalImageDimensions("/about/tian.png?v=2#top")).toEqual({ width: 1080, height: 1440 });
  });

  it("returns null for missing files", () => {
    expect(getLocalImageDimensions("/trips/does-not-exist/day1-1.jpg")).toBeNull();
  });

  it("refuses paths outside of public", () => {
    expect(getLocalImageDimensions("/../package.json")).toBeNull();
  });
});
