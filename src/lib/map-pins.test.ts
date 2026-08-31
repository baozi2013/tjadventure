import { describe, expect, it } from "vitest";
import { getWorldMapPins } from "@/lib/map-pins";
import { getAllCyclingEntries } from "@/lib/cycling";

describe("getWorldMapPins", () => {
  it("includes every cycling entry that has either an explicit location or a GeoJSON track", () => {
    const pins = getWorldMapPins("zh-CN");
    const cyclingPinIds = new Set(pins.filter((pin) => pin.kind === "cycling").map((pin) => pin.id));
    const cyclingEntries = getAllCyclingEntries("zh-CN");

    for (const entry of cyclingEntries) {
      const hasExplicitLocation = entry.location.lat != null && entry.location.lng != null;
      const hasTrack = Boolean(entry.route?.track);
      if (hasExplicitLocation || hasTrack) {
        expect(cyclingPinIds.has(`cycling-${entry.slug}`)).toBe(true);
      }
    }
  });

  it("derives a plausible start coordinate from the track for a ride with no explicit location", () => {
    const pins = getWorldMapPins("zh-CN");
    const mountDiablo = pins.find((pin) => pin.id === "cycling-mount-diablo-2025");

    expect(mountDiablo).toBeDefined();
    expect(mountDiablo?.lat).toBeGreaterThan(37);
    expect(mountDiablo?.lat).toBeLessThan(38);
    expect(mountDiablo?.lng).toBeGreaterThan(-122.5);
    expect(mountDiablo?.lng).toBeLessThan(-121.5);
  });

  it("produces unique pin ids", () => {
    const pins = getWorldMapPins("zh-CN");
    const ids = pins.map((pin) => pin.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
