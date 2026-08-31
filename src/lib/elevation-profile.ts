import type { TrackPoint } from "@/lib/geojson-track";
import { toFeet } from "@/lib/units";

export type ElevationProfilePoint = {
  distanceMiles: number;
  elevationFeet: number;
};

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceMiles(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

function downsample<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;

  const step = (items.length - 1) / (maxPoints - 1);
  const sampled: T[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    sampled.push(items[Math.round(i * step)]);
  }
  return sampled;
}

export function buildElevationProfile(points: TrackPoint[], maxPoints = 300): ElevationProfilePoint[] {
  const withElevation = points.filter((point) => typeof point.elevationMeters === "number");
  if (withElevation.length < 2) return [];

  let distanceMiles = 0;
  const full: ElevationProfilePoint[] = [
    { distanceMiles: 0, elevationFeet: toFeet(withElevation[0].elevationMeters as number, "m") },
  ];

  for (let i = 1; i < withElevation.length; i += 1) {
    distanceMiles += haversineDistanceMiles(withElevation[i - 1], withElevation[i]);
    full.push({
      distanceMiles,
      elevationFeet: toFeet(withElevation[i].elevationMeters as number, "m"),
    });
  }

  return downsample(full, maxPoints);
}
