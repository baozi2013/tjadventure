import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { routing, type Locale } from "@/i18n/routing";
import { DEFAULT_CONTENT_LOCALE, getLocalizedContentPath } from "@/lib/content-locale";
import { readFileWithMtimeCache } from "@/lib/content-cache";
import {
  extractHeadings as extractContentHeadings,
  extractPlainText,
  isObjectRecord,
  makeFrontmatterFail,
  normalizeText,
  parseLatLng,
  readLocale,
  readOptionalLocale,
  readOptionalStringArray,
  readOptionalText,
  readRequiredText,
  validateAssetPath,
  validateCalendarDate,
  validateContentLocale,
  validateTranslationKey,
  type Fail,
  type RawFrontmatter,
} from "@/lib/content-frontmatter";
import {
  CYCLING_DISTANCE_UNITS,
  CYCLING_ELEVATION_UNITS,
  CYCLING_IMAGE_ROLES,
  CYCLING_RIDE_TYPES,
  CYCLING_ROUTE_SURFACES,
  type CyclingDistanceUnit,
  type CyclingElevationUnit,
  type CyclingEntry,
  type CyclingFrontmatter,
  type CyclingImage,
  type CyclingImageRole,
  type CyclingLocation,
  type CyclingMeasure,
  type CyclingRideType,
  type CyclingRoute,
  type CyclingRouteSurface,
  type CyclingSummary,
} from "@/types/cycling";
import { MAP_TRACK_FORMATS, type MapRouteTrack, type MapTrackFormat } from "@/types/maps";
import type { SearchIndexEntry } from "@/types/search";

const CYCLING_DIR = path.join(process.cwd(), "content/cycling");
const CYCLING_EN_DIR = path.join(process.cwd(), "content/en/cycling");
const MOVING_TIME_FORMAT = /^\d{1,3}:[0-5]\d:[0-5]\d$/;

function readRideType(rawRideType: string, fail: Fail): CyclingRideType {
  if (!CYCLING_RIDE_TYPES.includes(rawRideType as CyclingRideType)) {
    fail(`"rideType" must be one of: ${CYCLING_RIDE_TYPES.join(", ")}.`);
  }

  return rawRideType as CyclingRideType;
}

function validateMovingTime(rawMovingTime: string, fail: Fail): string {
  if (!MOVING_TIME_FORMAT.test(rawMovingTime)) {
    fail(`"movingTime" must use HHH:MM:SS format, for example "5:12:30".`);
  }

  return rawMovingTime;
}

function readPositiveNumber(value: unknown, fieldName: string, fail: Fail): number {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    fail(`"${fieldName}" must be a positive number.`);
  }

  return parsed;
}

function readMeasurement<TUnit extends string>(
  frontmatter: RawFrontmatter,
  key: keyof CyclingFrontmatter,
  validUnits: readonly TUnit[],
  fail: Fail,
): CyclingMeasure<TUnit> {
  const value = frontmatter[key];
  if (!isObjectRecord(value)) {
    fail(`"${key}" must be an object with "value" and "unit".`);
  }

  const unit = value.unit;
  if (typeof unit !== "string" || !validUnits.includes(unit as TUnit)) {
    fail(`"${key}.unit" must be one of: ${validUnits.join(", ")}.`);
  }

  const display = value.display;
  if (display != null && (typeof display !== "string" || display.trim().length === 0)) {
    fail(`"${key}.display" must be a non-empty string when provided.`);
  }

  return {
    value: readPositiveNumber(value.value, `${String(key)}.value`, fail),
    unit: unit as TUnit,
    display: typeof display === "string" ? display.trim() : undefined,
  };
}

function readOptionalNumber(record: RawFrontmatter, key: "lat" | "lng", fieldName: string, fail: Fail): number | undefined {
  const value = record[key];
  if (value == null) return undefined;

  return parseLatLng(value, key, fieldName, fail);
}

function readLocation(frontmatter: RawFrontmatter, fail: Fail): CyclingLocation {
  const value = frontmatter.location;
  if (!isObjectRecord(value)) {
    fail(`"location" must be an object.`);
  }

  const name = readOptionalText(value, "name", "location.name", fail);
  const region = readOptionalText(value, "region", "location.region", fail);
  if (!name || !region) {
    fail(`"location" must include "name" and "region".`);
  }

  return {
    name,
    region,
    lat: readOptionalNumber(value, "lat", "location.lat", fail),
    lng: readOptionalNumber(value, "lng", "location.lng", fail),
    note: readOptionalText(value, "note", "location.note", fail),
  };
}

function readOptionalSurface(value: RawFrontmatter, fail: Fail): CyclingRouteSurface[] | undefined {
  const rawSurface = value.surface;
  if (rawSurface == null) return undefined;

  if (!Array.isArray(rawSurface) || rawSurface.length === 0) {
    fail(`"route.surface" must be a non-empty array when provided.`);
  }

  return rawSurface.map((item, index) => {
    if (typeof item !== "string" || !CYCLING_ROUTE_SURFACES.includes(item as CyclingRouteSurface)) {
      fail(`"route.surface[${index}]" must be one of: ${CYCLING_ROUTE_SURFACES.join(", ")}.`);
    }

    return item as CyclingRouteSurface;
  });
}

function readOptionalTrack(value: RawFrontmatter, fail: Fail): MapRouteTrack | undefined {
  const rawTrack = value.track;
  if (rawTrack == null) return undefined;

  if (!isObjectRecord(rawTrack)) {
    fail(`"route.track" must be an object when provided.`);
  }

  const src = readOptionalText(rawTrack, "src", "route.track.src", fail);
  if (!src) {
    fail(`"route.track" must include "src".`);
  }

  const rawFormat = readOptionalText(rawTrack, "format", "route.track.format", fail);
  const format = rawFormat ?? "geojson";
  if (!MAP_TRACK_FORMATS.includes(format as MapTrackFormat)) {
    fail(`"route.track.format" must be one of: ${MAP_TRACK_FORMATS.join(", ")}.`);
  }

  const title = readOptionalText(rawTrack, "title", "route.track.title", fail);
  const color = readOptionalText(rawTrack, "color", "route.track.color", fail);

  return {
    src: validateAssetPath(src, "route.track.src", fail),
    format: format as MapTrackFormat,
    title,
    color,
  };
}

function readOptionalRoute(frontmatter: RawFrontmatter, fail: Fail): CyclingRoute | undefined {
  const value = frontmatter.route;
  if (value == null) return undefined;

  if (!isObjectRecord(value)) {
    fail(`"route" must be an object when provided.`);
  }

  const route = {
    name: readOptionalText(value, "name", "route.name", fail),
    start: readOptionalText(value, "start", "route.start", fail),
    finish: readOptionalText(value, "finish", "route.finish", fail),
    surface: readOptionalSurface(value, fail),
    track: readOptionalTrack(value, fail),
  };

  if (!route.name && !route.start && !route.finish && !route.surface && !route.track) {
    fail(`"route" must include at least one field when provided.`);
  }

  return route;
}

function readImageRole(rawRole: unknown, fail: Fail, index: number): CyclingImageRole | undefined {
  if (rawRole == null) return undefined;

  if (typeof rawRole !== "string" || !CYCLING_IMAGE_ROLES.includes(rawRole as CyclingImageRole)) {
    fail(`"images[${index}].role" must be one of: ${CYCLING_IMAGE_ROLES.join(", ")}.`);
  }

  return rawRole as CyclingImageRole;
}

function readOptionalImages(frontmatter: RawFrontmatter, fail: Fail): CyclingImage[] | undefined {
  const value = frontmatter.images;
  if (value == null) return undefined;

  if (!Array.isArray(value) || value.length === 0) {
    fail(`"images" must be a non-empty array when provided.`);
  }

  return value.map((item, index) => {
    if (!isObjectRecord(item)) {
      fail(`"images[${index}]" must be an object.`);
    }

    const src = readOptionalText(item, "src", `images[${index}].src`, fail);
    const alt = readOptionalText(item, "alt", `images[${index}].alt`, fail);
    if (!src || !alt) {
      fail(`"images[${index}]" must include "src" and "alt".`);
    }

    return {
      src: validateAssetPath(src, `images[${index}].src`, fail),
      alt,
      caption: readOptionalText(item, "caption", `images[${index}].caption`, fail),
      role: readImageRole(item.role, fail, index),
    };
  });
}

function validateStravaUrl(rawUrl: string, fail: Fail): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    fail(`"stravaUrl" must be a valid URL.`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    fail(`"stravaUrl" must use http(s).`);
  }

  if (url.hostname !== "strava.com" && !url.hostname.endsWith(".strava.com")) {
    fail(`"stravaUrl" must point to strava.com.`);
  }

  if (!url.pathname.startsWith("/activities/")) {
    fail(`"stravaUrl" must point to a Strava activity URL.`);
  }

  return rawUrl;
}

export function parseCyclingFrontmatter(data: unknown, filePath: string, expectedLocale: Locale): CyclingFrontmatter {
  const fail: Fail = makeFrontmatterFail("cycling", filePath);
  if (!isObjectRecord(data)) {
    fail("frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", fail);
  const excerpt = readRequiredText(data, "excerpt", fail);
  const locale = validateContentLocale(readLocale(data, "locale", fail), expectedLocale, fail);
  const translationKey = validateTranslationKey(readRequiredText(data, "translationKey", fail), fail);
  const canonicalLocale = readOptionalLocale(data, "canonicalLocale", fail);
  const rideDate = validateCalendarDate(readRequiredText(data, "rideDate", fail), "rideDate", fail);
  const rideType = readRideType(readRequiredText(data, "rideType", fail), fail);
  const distance = readMeasurement<CyclingDistanceUnit>(data, "distance", CYCLING_DISTANCE_UNITS, fail);
  const elevationGain = readMeasurement<CyclingElevationUnit>(data, "elevationGain", CYCLING_ELEVATION_UNITS, fail);
  const movingTime = validateMovingTime(readRequiredText(data, "movingTime", fail), fail);
  const location = readLocation(data, fail);
  const route = readOptionalRoute(data, fail);
  const stravaUrl = validateStravaUrl(readRequiredText(data, "stravaUrl", fail), fail);
  const logistics = readOptionalStringArray(data, "logistics", fail, { allowEmpty: false });
  const notes = readOptionalStringArray(data, "notes", fail, { allowEmpty: false });
  const coverImage = validateAssetPath(readRequiredText(data, "coverImage", fail), "coverImage", fail);
  const images = readOptionalImages(data, fail);
  const tags = readOptionalStringArray(data, "tags", fail, { allowEmpty: false });

  return {
    title,
    excerpt,
    locale,
    translationKey,
    canonicalLocale,
    rideDate,
    rideType,
    distance,
    elevationGain,
    movingTime,
    location,
    route,
    stravaUrl,
    logistics,
    notes,
    coverImage,
    images,
    tags,
  };
}

function getCyclingDirectory(locale: Locale) {
  return locale === "en-US" ? CYCLING_EN_DIR : CYCLING_DIR;
}

function getCyclingFilenames(locale: Locale = DEFAULT_CONTENT_LOCALE) {
  const cyclingDir = getCyclingDirectory(locale);
  if (!fs.existsSync(cyclingDir)) return [];

  return fs.readdirSync(cyclingDir).filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
}

function getCyclingPath(fileName: string, locale: Locale) {
  return getLocalizedContentPath(CYCLING_DIR, CYCLING_EN_DIR, fileName, locale, { fallbackToDefault: false });
}

function readParsedCyclingEntry(fullPath: string, slug: string, locale: Locale): CyclingEntry {
  return readFileWithMtimeCache(fullPath, () => {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const frontmatter = parseCyclingFrontmatter(data, fullPath, locale);

    return {
      slug,
      ...frontmatter,
      content,
      headings: extractContentHeadings(content),
    };
  });
}

function sortByRideDate<T extends { rideDate: string }>(a: T, b: T) {
  return +new Date(b.rideDate) - +new Date(a.rideDate);
}

function formatMeasurement(measurement: CyclingMeasure<string>) {
  return measurement.display ?? `${measurement.value} ${measurement.unit}`;
}

export function getAllCyclingEntries(locale: Locale = DEFAULT_CONTENT_LOCALE): CyclingSummary[] {
  return getCyclingFilenames(locale)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getCyclingPath(file, locale);
      const entry = readParsedCyclingEntry(fullPath, slug, locale);

      return {
        slug: entry.slug,
        title: entry.title,
        excerpt: entry.excerpt,
        locale: entry.locale,
        translationKey: entry.translationKey,
        canonicalLocale: entry.canonicalLocale,
        rideDate: entry.rideDate,
        rideType: entry.rideType,
        distance: entry.distance,
        elevationGain: entry.elevationGain,
        movingTime: entry.movingTime,
        location: entry.location,
        route: entry.route,
        stravaUrl: entry.stravaUrl,
        logistics: entry.logistics,
        notes: entry.notes,
        coverImage: entry.coverImage,
        images: entry.images,
        tags: entry.tags,
      };
    })
    .sort(sortByRideDate);
}

export function getCyclingSearchIndex(locale: Locale = DEFAULT_CONTENT_LOCALE): SearchIndexEntry[] {
  return getCyclingFilenames(locale)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getCyclingPath(file, locale);
      const entry = readParsedCyclingEntry(fullPath, slug, locale);
      const headings = entry.headings.map((heading) => heading.text);
      const routeTerms = [entry.route?.name, entry.route?.start, entry.route?.finish, entry.route?.track?.title].filter(
        (term): term is string => Boolean(term),
      );
      const locations = [
        normalizeText(`${entry.location.name} ${entry.location.region} ${entry.location.note ?? ""}`),
        ...routeTerms,
      ];
      const tags = entry.tags ?? [];
      const body = extractPlainText(entry.content);
      const stats = [
        formatMeasurement(entry.distance),
        formatMeasurement(entry.elevationGain),
        entry.movingTime,
      ].join(" ");
      const category = `${entry.location.region} · Cycling`;
      const rideLabel = `${entry.rideType.charAt(0).toUpperCase()}${entry.rideType.slice(1)} ride`;
      const searchText = normalizeText(
        [
          entry.title,
          entry.excerpt,
          category,
          rideLabel,
          stats,
          tags.join(" "),
          headings.join(" "),
          locations.join(" "),
          (entry.logistics ?? []).join(" "),
          (entry.notes ?? []).join(" "),
          body,
        ].join(" ").toLowerCase(),
      );

      return {
        slug: entry.slug,
        locale: entry.locale,
        translationKey: entry.translationKey,
        href: `/cycling/${entry.slug}`,
        title: entry.title,
        excerpt: entry.excerpt,
        category,
        region: entry.location.region,
        date: entry.rideDate,
        readTime: `${rideLabel} · ${entry.movingTime}`,
        coverImage: entry.coverImage,
        tags,
        headings,
        locations,
        body,
        searchText,
      };
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getCyclingEntryBySlug(slug: string, locale: Locale = DEFAULT_CONTENT_LOCALE) {
  const fileName = `${slug}.mdx`;
  const fullPath = getCyclingPath(fileName, locale);
  if (!fs.existsSync(fullPath)) return null;

  return readParsedCyclingEntry(fullPath, slug, locale);
}

export function getCyclingLanguageAlternates(translationKey: string): Partial<Record<Locale, string>> {
  return Object.fromEntries(
    routing.locales.flatMap((locale) =>
      getAllCyclingEntries(locale)
        .filter((entry) => entry.translationKey === translationKey)
        .map((entry) => [locale, `/cycling/${entry.slug}`] as const),
    ),
  ) as Partial<Record<Locale, string>>;
}
