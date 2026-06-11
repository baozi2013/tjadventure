import type { MapRouteTrack } from "./maps";
import type { Locale } from "@/i18n/routing";

export const CYCLING_RIDE_TYPES = ["road", "gravel", "event"] as const;

export type CyclingRideType = (typeof CYCLING_RIDE_TYPES)[number];

export const CYCLING_DISTANCE_UNITS = ["mi", "km"] as const;

export type CyclingDistanceUnit = (typeof CYCLING_DISTANCE_UNITS)[number];

export const CYCLING_ELEVATION_UNITS = ["ft", "m"] as const;

export type CyclingElevationUnit = (typeof CYCLING_ELEVATION_UNITS)[number];

export const CYCLING_ROUTE_SURFACES = ["road", "gravel", "paved-trail", "mixed"] as const;

export type CyclingRouteSurface = (typeof CYCLING_ROUTE_SURFACES)[number];

export const CYCLING_IMAGE_ROLES = ["cover", "route", "gallery"] as const;

export type CyclingImageRole = (typeof CYCLING_IMAGE_ROLES)[number];

export type CyclingMeasure<TUnit extends string> = {
  value: number;
  unit: TUnit;
  display?: string;
};

export type CyclingLocation = {
  name: string;
  region: string;
  lat?: number;
  lng?: number;
  note?: string;
};

export type CyclingRoute = {
  name?: string;
  start?: string;
  finish?: string;
  surface?: CyclingRouteSurface[];
  track?: MapRouteTrack;
};

export type CyclingImage = {
  src: string;
  alt: string;
  caption?: string;
  role?: CyclingImageRole;
};

export type CyclingFrontmatter = {
  title: string;
  excerpt: string;
  locale: Locale;
  translationKey: string;
  canonicalLocale?: Locale;
  rideDate: string;
  rideType: CyclingRideType;
  distance: CyclingMeasure<CyclingDistanceUnit>;
  elevationGain: CyclingMeasure<CyclingElevationUnit>;
  movingTime: string;
  location: CyclingLocation;
  route?: CyclingRoute;
  stravaUrl: string;
  logistics?: string[];
  notes?: string[];
  coverImage: string;
  images?: CyclingImage[];
  tags?: string[];
};

export type CyclingSummary = CyclingFrontmatter & {
  slug: string;
};

export type CyclingHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

export type CyclingEntry = CyclingSummary & {
  content: string;
  headings: CyclingHeading[];
};
