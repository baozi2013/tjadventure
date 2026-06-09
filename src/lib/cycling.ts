import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cyclingEnglishTranslations } from "@/data/content-translations";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_CONTENT_LOCALE, getLocalizedContentPath } from "@/lib/content-locale";
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
  type CyclingHeading,
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
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const MOVING_TIME_FORMAT = /^\d{1,3}:[0-5]\d:[0-5]\d$/;

type RawFrontmatter = Record<string, unknown>;

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, "")
    .replace(/-+/g, "-");
}

function isObjectRecord(value: unknown): value is RawFrontmatter {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failCyclingFrontmatter(filePath: string, message: string): never {
  throw new Error(`[cycling] Invalid frontmatter in "${filePath}": ${message}`);
}

function readRequiredText(frontmatter: RawFrontmatter, key: keyof CyclingFrontmatter, filePath: string): string {
  const value = frontmatter[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    failCyclingFrontmatter(filePath, `"${key}" must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalText(record: RawFrontmatter, key: string, filePath: string, fieldName: string): string | undefined {
  const value = record[key];
  if (value == null) return undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must be a non-empty string when provided.`);
  }

  return value.trim();
}

function validateDate(rawDate: string, filePath: string): string {
  if (!DATE_FORMAT.test(rawDate)) {
    failCyclingFrontmatter(filePath, `"rideDate" must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = rawDate.split("-").map((value) => Number.parseInt(value, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day
  ) {
    failCyclingFrontmatter(filePath, `"rideDate" is not a valid calendar date.`);
  }

  return rawDate;
}

function readRideType(rawRideType: string, filePath: string): CyclingRideType {
  if (!CYCLING_RIDE_TYPES.includes(rawRideType as CyclingRideType)) {
    failCyclingFrontmatter(filePath, `"rideType" must be one of: ${CYCLING_RIDE_TYPES.join(", ")}.`);
  }

  return rawRideType as CyclingRideType;
}

function validateMovingTime(rawMovingTime: string, filePath: string): string {
  if (!MOVING_TIME_FORMAT.test(rawMovingTime)) {
    failCyclingFrontmatter(filePath, `"movingTime" must use HHH:MM:SS format, for example "5:12:30".`);
  }

  return rawMovingTime;
}

function validateLocalAssetPath(rawPath: string, fieldName: string, filePath: string): string {
  if (!rawPath.startsWith("/")) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must start with "/" when using local assets.`);
  }

  if (rawPath.includes("..")) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must not contain ".." segments.`);
  }

  return rawPath;
}

function validateImagePath(rawImagePath: string, fieldName: string, filePath: string): string {
  if (rawImagePath.startsWith("/")) {
    return validateLocalAssetPath(rawImagePath, fieldName, filePath);
  }

  if (/^https?:\/\//.test(rawImagePath)) {
    return rawImagePath;
  }

  failCyclingFrontmatter(filePath, `"${fieldName}" must be an absolute path (starting with "/") or an http(s) URL.`);
}

function validateAssetPath(rawPath: string, fieldName: string, filePath: string): string {
  if (rawPath.startsWith("/")) {
    return validateLocalAssetPath(rawPath, fieldName, filePath);
  }

  if (/^https?:\/\//.test(rawPath)) {
    return rawPath;
  }

  failCyclingFrontmatter(filePath, `"${fieldName}" must be an absolute path (starting with "/") or an http(s) URL.`);
}

function validateStravaUrl(rawUrl: string, filePath: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    failCyclingFrontmatter(filePath, `"stravaUrl" must be a valid URL.`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    failCyclingFrontmatter(filePath, `"stravaUrl" must use http(s).`);
  }

  if (url.hostname !== "strava.com" && !url.hostname.endsWith(".strava.com")) {
    failCyclingFrontmatter(filePath, `"stravaUrl" must point to strava.com.`);
  }

  if (!url.pathname.startsWith("/activities/")) {
    failCyclingFrontmatter(filePath, `"stravaUrl" must point to a Strava activity URL.`);
  }

  return rawUrl;
}

function readPositiveNumber(value: unknown, fieldName: string, filePath: string): number {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must be a positive number.`);
  }

  return parsed;
}

function readMeasurement<TUnit extends string>(
  frontmatter: RawFrontmatter,
  key: keyof CyclingFrontmatter,
  validUnits: readonly TUnit[],
  filePath: string,
): CyclingMeasure<TUnit> {
  const value = frontmatter[key];
  if (!isObjectRecord(value)) {
    failCyclingFrontmatter(filePath, `"${key}" must be an object with "value" and "unit".`);
  }

  const unit = value.unit;
  if (typeof unit !== "string" || !validUnits.includes(unit as TUnit)) {
    failCyclingFrontmatter(filePath, `"${key}.unit" must be one of: ${validUnits.join(", ")}.`);
  }

  const display = value.display;
  if (display != null && (typeof display !== "string" || display.trim().length === 0)) {
    failCyclingFrontmatter(filePath, `"${key}.display" must be a non-empty string when provided.`);
  }

  return {
    value: readPositiveNumber(value.value, `${String(key)}.value`, filePath),
    unit: unit as TUnit,
    display: typeof display === "string" ? display.trim() : undefined,
  };
}

function readOptionalStringArray(
  frontmatter: RawFrontmatter,
  key: keyof CyclingFrontmatter,
  filePath: string,
): string[] | undefined {
  const value = frontmatter[key];
  if (value == null) return undefined;

  if (!Array.isArray(value)) {
    failCyclingFrontmatter(filePath, `"${key}" must be an array of strings when provided.`);
  }

  const items = value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      failCyclingFrontmatter(filePath, `"${key}[${index}]" must be a non-empty string.`);
    }

    return item.trim();
  });

  if (items.length === 0) {
    failCyclingFrontmatter(filePath, `"${key}" cannot be an empty array when provided.`);
  }

  return items;
}

function readOptionalNumber(
  record: RawFrontmatter,
  key: "lat" | "lng",
  filePath: string,
  fieldName: string,
): number | undefined {
  const value = record[key];
  if (value == null) return undefined;

  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must be a valid number.`);
  }

  if (key === "lat" && (parsed < -90 || parsed > 90)) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must be in range [-90, 90].`);
  }

  if (key === "lng" && (parsed < -180 || parsed > 180)) {
    failCyclingFrontmatter(filePath, `"${fieldName}" must be in range [-180, 180].`);
  }

  return parsed;
}

function readLocation(frontmatter: RawFrontmatter, filePath: string): CyclingLocation {
  const value = frontmatter.location;
  if (!isObjectRecord(value)) {
    failCyclingFrontmatter(filePath, `"location" must be an object.`);
  }

  const name = readOptionalText(value, "name", filePath, "location.name");
  const region = readOptionalText(value, "region", filePath, "location.region");
  if (!name || !region) {
    failCyclingFrontmatter(filePath, `"location" must include "name" and "region".`);
  }

  return {
    name,
    region,
    lat: readOptionalNumber(value, "lat", filePath, "location.lat"),
    lng: readOptionalNumber(value, "lng", filePath, "location.lng"),
    note: readOptionalText(value, "note", filePath, "location.note"),
  };
}

function readOptionalSurface(value: RawFrontmatter, filePath: string): CyclingRouteSurface[] | undefined {
  const rawSurface = value.surface;
  if (rawSurface == null) return undefined;

  if (!Array.isArray(rawSurface) || rawSurface.length === 0) {
    failCyclingFrontmatter(filePath, `"route.surface" must be a non-empty array when provided.`);
  }

  return rawSurface.map((item, index) => {
    if (typeof item !== "string" || !CYCLING_ROUTE_SURFACES.includes(item as CyclingRouteSurface)) {
      failCyclingFrontmatter(
        filePath,
        `"route.surface[${index}]" must be one of: ${CYCLING_ROUTE_SURFACES.join(", ")}.`,
      );
    }

    return item as CyclingRouteSurface;
  });
}

function readOptionalTrack(value: RawFrontmatter, filePath: string): MapRouteTrack | undefined {
  const rawTrack = value.track;
  if (rawTrack == null) return undefined;

  if (!isObjectRecord(rawTrack)) {
    failCyclingFrontmatter(filePath, `"route.track" must be an object when provided.`);
  }

  const src = readOptionalText(rawTrack, "src", filePath, "route.track.src");
  if (!src) {
    failCyclingFrontmatter(filePath, `"route.track" must include "src".`);
  }

  const rawFormat = readOptionalText(rawTrack, "format", filePath, "route.track.format");
  const format = rawFormat ?? "geojson";
  if (!MAP_TRACK_FORMATS.includes(format as MapTrackFormat)) {
    failCyclingFrontmatter(filePath, `"route.track.format" must be one of: ${MAP_TRACK_FORMATS.join(", ")}.`);
  }

  const title = readOptionalText(rawTrack, "title", filePath, "route.track.title");
  const color = readOptionalText(rawTrack, "color", filePath, "route.track.color");

  return {
    src: validateAssetPath(src, "route.track.src", filePath),
    format: format as MapTrackFormat,
    title,
    color,
  };
}

function readOptionalRoute(frontmatter: RawFrontmatter, filePath: string): CyclingRoute | undefined {
  const value = frontmatter.route;
  if (value == null) return undefined;

  if (!isObjectRecord(value)) {
    failCyclingFrontmatter(filePath, `"route" must be an object when provided.`);
  }

  const route = {
    name: readOptionalText(value, "name", filePath, "route.name"),
    start: readOptionalText(value, "start", filePath, "route.start"),
    finish: readOptionalText(value, "finish", filePath, "route.finish"),
    surface: readOptionalSurface(value, filePath),
    track: readOptionalTrack(value, filePath),
  };

  if (!route.name && !route.start && !route.finish && !route.surface && !route.track) {
    failCyclingFrontmatter(filePath, `"route" must include at least one field when provided.`);
  }

  return route;
}

function readImageRole(rawRole: unknown, filePath: string, index: number): CyclingImageRole | undefined {
  if (rawRole == null) return undefined;

  if (typeof rawRole !== "string" || !CYCLING_IMAGE_ROLES.includes(rawRole as CyclingImageRole)) {
    failCyclingFrontmatter(filePath, `"images[${index}].role" must be one of: ${CYCLING_IMAGE_ROLES.join(", ")}.`);
  }

  return rawRole as CyclingImageRole;
}

function readOptionalImages(frontmatter: RawFrontmatter, filePath: string): CyclingImage[] | undefined {
  const value = frontmatter.images;
  if (value == null) return undefined;

  if (!Array.isArray(value) || value.length === 0) {
    failCyclingFrontmatter(filePath, `"images" must be a non-empty array when provided.`);
  }

  return value.map((item, index) => {
    if (!isObjectRecord(item)) {
      failCyclingFrontmatter(filePath, `"images[${index}]" must be an object.`);
    }

    const src = readOptionalText(item, "src", filePath, `images[${index}].src`);
    const alt = readOptionalText(item, "alt", filePath, `images[${index}].alt`);
    if (!src || !alt) {
      failCyclingFrontmatter(filePath, `"images[${index}]" must include "src" and "alt".`);
    }

    return {
      src: validateImagePath(src, `images[${index}].src`, filePath),
      alt,
      caption: readOptionalText(item, "caption", filePath, `images[${index}].caption`),
      role: readImageRole(item.role, filePath, index),
    };
  });
}

export function parseCyclingFrontmatter(data: unknown, filePath: string): CyclingFrontmatter {
  if (!isObjectRecord(data)) {
    failCyclingFrontmatter(filePath, "frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", filePath);
  const excerpt = readRequiredText(data, "excerpt", filePath);
  const rideDate = validateDate(readRequiredText(data, "rideDate", filePath), filePath);
  const rideType = readRideType(readRequiredText(data, "rideType", filePath), filePath);
  const distance = readMeasurement<CyclingDistanceUnit>(data, "distance", CYCLING_DISTANCE_UNITS, filePath);
  const elevationGain = readMeasurement<CyclingElevationUnit>(
    data,
    "elevationGain",
    CYCLING_ELEVATION_UNITS,
    filePath,
  );
  const movingTime = validateMovingTime(readRequiredText(data, "movingTime", filePath), filePath);
  const location = readLocation(data, filePath);
  const route = readOptionalRoute(data, filePath);
  const stravaUrl = validateStravaUrl(readRequiredText(data, "stravaUrl", filePath), filePath);
  const logistics = readOptionalStringArray(data, "logistics", filePath);
  const notes = readOptionalStringArray(data, "notes", filePath);
  const coverImage = validateImagePath(readRequiredText(data, "coverImage", filePath), "coverImage", filePath);
  const images = readOptionalImages(data, filePath);
  const tags = readOptionalStringArray(data, "tags", filePath);

  return {
    title,
    excerpt,
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

function getCyclingFilenames() {
  if (!fs.existsSync(CYCLING_DIR)) return [];

  return fs.readdirSync(CYCLING_DIR).filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
}

function getCyclingPath(fileName: string, locale: Locale) {
  return getLocalizedContentPath(CYCLING_DIR, CYCLING_EN_DIR, fileName, locale);
}

function readParsedCyclingEntry(fullPath: string, slug: string, locale: Locale): CyclingEntry {
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseCyclingFrontmatter(data, fullPath);
  const translation = locale === "en-US" ? cyclingEnglishTranslations[slug] : undefined;
  const localizedFrontmatter = translation
    ? {
        ...frontmatter,
        title: translation.title,
        excerpt: translation.excerpt,
        location: {
          ...frontmatter.location,
          note: translation.locationNote ?? frontmatter.location.note,
        },
        route: frontmatter.route
          ? {
              ...frontmatter.route,
              name: translation.routeName ?? frontmatter.route.name,
            }
          : frontmatter.route,
        logistics: translation.logistics ?? frontmatter.logistics,
        notes: translation.notes ?? frontmatter.notes,
        images: frontmatter.images?.map((image, index) => {
          const imageTranslation = translation.images?.[index];
          return imageTranslation
            ? {
                ...image,
                alt: imageTranslation.alt,
                caption: imageTranslation.caption,
              }
            : image;
        }),
      }
    : frontmatter;
  const localizedContent = translation?.content ?? content;

  return {
    slug,
    ...localizedFrontmatter,
    content: localizedContent,
    headings: extractHeadings(localizedContent),
  };
}

function sortByRideDate<T extends { rideDate: string }>(a: T, b: T) {
  return +new Date(b.rideDate) - +new Date(a.rideDate);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractPlainText(content: string) {
  return normalizeText(
    content
      .replace(/^import\s.+$/gm, " ")
      .replace(/^export\s.+$/gm, " ")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, " $1 ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, " $1 ")
      .replace(/`([^`]+)`/g, " $1 ")
      .replace(/<[^>]+>/g, " ")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/[*_~|]/g, " "),
  );
}

function formatMeasurement(measurement: CyclingMeasure<string>) {
  return measurement.display ?? `${measurement.value} ${measurement.unit}`;
}

export function getAllCyclingEntries(locale: Locale = DEFAULT_CONTENT_LOCALE): CyclingSummary[] {
  return getCyclingFilenames()
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getCyclingPath(file, locale);
      const entry = readParsedCyclingEntry(fullPath, slug, locale);

      return {
        slug: entry.slug,
        title: entry.title,
        excerpt: entry.excerpt,
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
  return getCyclingFilenames()
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
  const basePath = path.join(CYCLING_DIR, fileName);
  if (!fs.existsSync(basePath)) return null;

  return readParsedCyclingEntry(getCyclingPath(fileName, locale), slug, locale);
}

function extractHeadings(content: string): CyclingHeading[] {
  const lines = content.split("\n");
  const headings: CyclingHeading[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const text = line.replace("## ", "").trim();
      headings.push({ level: 2, text, id: slugify(text) });
    }
    if (line.startsWith("### ")) {
      const text = line.replace("### ", "").trim();
      headings.push({ level: 3, text, id: slugify(text) });
    }
  }

  return headings;
}
