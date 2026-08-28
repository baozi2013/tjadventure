import { describe, expect, it } from "vitest";
import { computeSiteStats, toFeet, toMiles } from "@/lib/stats";
import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllPosts } from "@/lib/posts";

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

describe("computeSiteStats", () => {
  it("matches the real content counts", () => {
    const stats = computeSiteStats("zh-CN");

    expect(stats.totalPosts).toBe(getAllPosts("zh-CN").length);
    expect(stats.totalCyclingRides).toBe(getAllCyclingEntries("zh-CN").length);
  });

  it("sums cycling distance and elevation across all rides", () => {
    const stats = computeSiteStats("zh-CN");
    const cyclingEntries = getAllCyclingEntries("zh-CN");
    const expectedDistance = cyclingEntries.reduce(
      (sum, entry) => sum + toMiles(entry.distance.value, entry.distance.unit),
      0,
    );

    expect(stats.totalDistanceMiles).toBeCloseTo(expectedDistance, 5);
    expect(stats.totalDistanceMiles).toBeGreaterThan(0);
    expect(stats.totalElevationFeet).toBeGreaterThan(0);
  });

  it("reports a non-empty, deduplicated, sorted region list", () => {
    const stats = computeSiteStats("zh-CN");

    expect(stats.regions.length).toBeGreaterThan(0);
    expect(new Set(stats.regions).size).toBe(stats.regions.length);
    expect(stats.regions).toEqual([...stats.regions].sort());
  });

  it("finds the earliest year across posts and cycling entries", () => {
    const stats = computeSiteStats("zh-CN");
    const posts = getAllPosts("zh-CN");
    const cyclingEntries = getAllCyclingEntries("zh-CN");
    const expectedYear = Math.min(
      ...posts.map((post) => new Date(post.date).getFullYear()),
      ...cyclingEntries.map((entry) => new Date(entry.rideDate).getFullYear()),
    );

    expect(stats.firstYear).toBe(expectedYear);
  });
});
