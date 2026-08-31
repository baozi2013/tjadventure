import type { CyclingDistanceUnit, CyclingElevationUnit } from "@/types/cycling";

const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;

export function toMiles(value: number, unit: CyclingDistanceUnit): number {
  return unit === "km" ? value * KM_TO_MI : value;
}

export function toFeet(value: number, unit: CyclingElevationUnit): number {
  return unit === "m" ? value * M_TO_FT : value;
}
