import { describe, expect, it } from "vitest";
import { buildElevationProfile, haversineDistanceMiles } from "@/lib/elevation-profile";

describe("haversineDistanceMiles", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistanceMiles({ lat: 37.7749, lng: -122.4194 }, { lat: 37.7749, lng: -122.4194 })).toBe(0);
  });

  it("matches the known distance between San Francisco and Los Angeles (~347 mi)", () => {
    const sf = { lat: 37.7749, lng: -122.4194 };
    const la = { lat: 34.0522, lng: -118.2437 };
    expect(haversineDistanceMiles(sf, la)).toBeCloseTo(347, -1);
  });
});

describe("buildElevationProfile", () => {
  it("returns an empty array when fewer than 2 points have elevation", () => {
    expect(buildElevationProfile([{ lat: 0, lng: 0, elevationMeters: 10 }])).toEqual([]);
    expect(buildElevationProfile([{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }])).toEqual([]);
  });

  it("starts at distance 0 and converts elevation from meters to feet", () => {
    const profile = buildElevationProfile([
      { lat: 37.0, lng: -122.0, elevationMeters: 0 },
      { lat: 37.001, lng: -122.0, elevationMeters: 100 },
    ]);

    expect(profile[0].distanceMiles).toBe(0);
    expect(profile[0].elevationFeet).toBe(0);
    expect(profile[1].elevationFeet).toBeCloseTo(328.084, 2);
  });

  it("accumulates distance monotonically along the track", () => {
    const profile = buildElevationProfile([
      { lat: 37.0, lng: -122.0, elevationMeters: 0 },
      { lat: 37.01, lng: -122.0, elevationMeters: 50 },
      { lat: 37.02, lng: -122.0, elevationMeters: 100 },
      { lat: 37.03, lng: -122.0, elevationMeters: 50 },
    ]);

    for (let i = 1; i < profile.length; i += 1) {
      expect(profile[i].distanceMiles).toBeGreaterThan(profile[i - 1].distanceMiles);
    }
  });

  it("skips points that have no elevation value", () => {
    const profile = buildElevationProfile([
      { lat: 37.0, lng: -122.0, elevationMeters: 0 },
      { lat: 37.001, lng: -122.0 },
      { lat: 37.002, lng: -122.0, elevationMeters: 100 },
    ]);

    expect(profile).toHaveLength(2);
  });

  it("downsamples to maxPoints while preserving the first and last point", () => {
    const points = Array.from({ length: 1000 }, (_, i) => ({
      lat: 37 + i * 0.0001,
      lng: -122,
      elevationMeters: i,
    }));

    const profile = buildElevationProfile(points, 100);

    expect(profile).toHaveLength(100);
    expect(profile[0].distanceMiles).toBe(0);
    expect(profile[0].elevationFeet).toBeCloseTo(0, 5);
    expect(profile[profile.length - 1].elevationFeet).toBeCloseTo(999 * 3.28084, 1);
  });

  it("does not downsample when already within maxPoints", () => {
    const points = [
      { lat: 37.0, lng: -122.0, elevationMeters: 0 },
      { lat: 37.001, lng: -122.0, elevationMeters: 10 },
      { lat: 37.002, lng: -122.0, elevationMeters: 20 },
    ];

    expect(buildElevationProfile(points, 300)).toHaveLength(3);
  });
});
