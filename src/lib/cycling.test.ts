import { describe, expect, it } from "vitest";
import { parseCyclingFrontmatter } from "@/lib/cycling";

function validCyclingData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Lake Tahoe 2024 | Around-the-lake ride",
    excerpt: "A ride summary.",
    locale: "zh-CN",
    translationKey: "lake-tahoe-2024",
    rideDate: "2024-07-15",
    rideType: "road",
    distance: { value: 72.4, unit: "mi" },
    elevationGain: { value: 4200, unit: "ft" },
    movingTime: "5:12:30",
    location: { name: "Lake Tahoe", region: "US - California" },
    stravaUrl: "https://www.strava.com/activities/11881460715",
    coverImage: "/trips/lake-tahoe-2024/day1-2.jpg",
    ...overrides,
  };
}

describe("parseCyclingFrontmatter", () => {
  it("parses a valid frontmatter object", () => {
    const result = parseCyclingFrontmatter(validCyclingData(), "fixture.mdx", "zh-CN");
    expect(result.stravaUrl).toBe("https://www.strava.com/activities/11881460715");
    expect(result.distance).toEqual({ value: 72.4, unit: "mi", display: undefined });
  });

  it("rejects a non-Strava URL", () => {
    expect(() =>
      parseCyclingFrontmatter(
        validCyclingData({ stravaUrl: "https://example.com/activities/123" }),
        "fixture.mdx",
        "zh-CN",
      ),
    ).toThrow(/must point to strava\.com/);
  });

  it("accepts a strava.com subdomain", () => {
    const result = parseCyclingFrontmatter(
      validCyclingData({ stravaUrl: "https://www.strava.com/activities/123" }),
      "fixture.mdx",
      "zh-CN",
    );
    expect(result.stravaUrl).toBe("https://www.strava.com/activities/123");
  });

  it("rejects a Strava URL that isn't an activity path", () => {
    expect(() =>
      parseCyclingFrontmatter(
        validCyclingData({ stravaUrl: "https://www.strava.com/athletes/123" }),
        "fixture.mdx",
        "zh-CN",
      ),
    ).toThrow(/must point to a Strava activity URL/);
  });

  it("rejects a malformed URL", () => {
    expect(() =>
      parseCyclingFrontmatter(validCyclingData({ stravaUrl: "not a url" }), "fixture.mdx", "zh-CN"),
    ).toThrow(/must be a valid URL/);
  });

  it("rejects a non-http(s) protocol", () => {
    expect(() =>
      parseCyclingFrontmatter(
        validCyclingData({ stravaUrl: "ftp://www.strava.com/activities/123" }),
        "fixture.mdx",
        "zh-CN",
      ),
    ).toThrow(/must use http\(s\)/);
  });

  it("rejects an invalid rideType", () => {
    expect(() => parseCyclingFrontmatter(validCyclingData({ rideType: "unicycle" }), "fixture.mdx", "zh-CN")).toThrow(
      /"rideType" must be one of/,
    );
  });

  it("rejects a malformed movingTime", () => {
    expect(() =>
      parseCyclingFrontmatter(validCyclingData({ movingTime: "5 hours" }), "fixture.mdx", "zh-CN"),
    ).toThrow(/must use HHH:MM:SS format/);
  });

  it("rejects a non-positive distance value", () => {
    expect(() =>
      parseCyclingFrontmatter(
        validCyclingData({ distance: { value: 0, unit: "mi" } }),
        "fixture.mdx",
        "zh-CN",
      ),
    ).toThrow(/must be a positive number/);
  });

  it("rejects an invalid distance unit", () => {
    expect(() =>
      parseCyclingFrontmatter(
        validCyclingData({ distance: { value: 10, unit: "km/h" } }),
        "fixture.mdx",
        "zh-CN",
      ),
    ).toThrow(/"distance.unit" must be one of/);
  });

  it("rejects a location missing name or region", () => {
    expect(() =>
      parseCyclingFrontmatter(validCyclingData({ location: { name: "Lake Tahoe" } }), "fixture.mdx", "zh-CN"),
    ).toThrow(/must include "name" and "region"/);
  });

  it("rejects an empty tags array", () => {
    expect(() => parseCyclingFrontmatter(validCyclingData({ tags: [] }), "fixture.mdx", "zh-CN")).toThrow(
      /"tags" cannot be an empty array/,
    );
  });
});
