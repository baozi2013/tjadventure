import { isSupportedLocale, routing, type Locale } from "@/i18n/routing";

export type RawFrontmatter = Record<string, unknown>;
export type Fail = (message: string) => never;

export type ContentHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

const TRANSLATION_KEY_FORMAT = /^[a-z0-9][a-z0-9-]*$/;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function isObjectRecord(value: unknown): value is RawFrontmatter {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9一-龥\-]/g, "")
    .replace(/-+/g, "-");
}

export function makeFrontmatterFail(namespace: string, filePath: string): Fail {
  return (message: string) => {
    throw new Error(`[${namespace}] Invalid frontmatter in "${filePath}": ${message}`);
  };
}

export function readRequiredText(frontmatter: RawFrontmatter, key: string, fail: Fail): string {
  const value = frontmatter[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`"${key}" must be a non-empty string.`);
  }

  return value.trim();
}

export function readOptionalText(record: RawFrontmatter, key: string, fieldName: string, fail: Fail): string | undefined {
  const value = record[key];
  if (value == null) return undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`"${fieldName}" must be a non-empty string when provided.`);
  }

  return value.trim();
}

export function readLocale(frontmatter: RawFrontmatter, key: "locale" | "canonicalLocale", fail: Fail): Locale {
  const value = readRequiredText(frontmatter, key, fail);
  if (!isSupportedLocale(value)) {
    fail(`"${key}" must be one of: ${routing.locales.join(", ")}.`);
  }

  return value as Locale;
}

export function readOptionalLocale(
  frontmatter: RawFrontmatter,
  key: "canonicalLocale",
  fail: Fail,
): Locale | undefined {
  if (frontmatter[key] == null) return undefined;
  return readLocale(frontmatter, key, fail);
}

export function validateContentLocale(locale: Locale, expectedLocale: Locale, fail: Fail): Locale {
  if (locale !== expectedLocale) {
    fail(`"locale" must match its content directory (${expectedLocale}).`);
  }

  return locale;
}

export function validateTranslationKey(rawTranslationKey: string, fail: Fail): string {
  if (!TRANSLATION_KEY_FORMAT.test(rawTranslationKey)) {
    fail(`"translationKey" must use lowercase letters, numbers, and hyphens.`);
  }

  return rawTranslationKey;
}

export function validateCalendarDate(rawDate: string, fieldName: string, fail: Fail): string {
  if (!DATE_FORMAT.test(rawDate)) {
    fail(`"${fieldName}" must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = rawDate.split("-").map((value) => Number.parseInt(value, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day
  ) {
    fail(`"${fieldName}" is not a valid calendar date.`);
  }

  return rawDate;
}

export function validateLocalAssetPath(rawPath: string, fieldName: string, fail: Fail): string {
  if (!rawPath.startsWith("/")) {
    fail(`"${fieldName}" must start with "/" when using local assets.`);
  }

  if (rawPath.startsWith("//")) {
    fail(`"${fieldName}" must not use protocol-relative URLs.`);
  }

  if (rawPath.includes("..")) {
    fail(`"${fieldName}" must not contain ".." segments.`);
  }

  return rawPath;
}

export function validateAssetPath(rawPath: string, fieldName: string, fail: Fail): string {
  if (rawPath.startsWith("/")) {
    return validateLocalAssetPath(rawPath, fieldName, fail);
  }

  if (/^https?:\/\//.test(rawPath)) {
    return rawPath;
  }

  fail(`"${fieldName}" must be an absolute path (starting with "/") or an http(s) URL.`);
}

export function readOptionalStringArray(
  frontmatter: RawFrontmatter,
  key: string,
  fail: Fail,
  { allowEmpty = true }: { allowEmpty?: boolean } = {},
): string[] | undefined {
  const value = frontmatter[key];
  if (value == null) return undefined;

  if (!Array.isArray(value)) {
    fail(`"${key}" must be an array of strings when provided.`);
  }

  const items = value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      fail(`"${key}[${index}]" must be a non-empty string.`);
    }

    return item.trim();
  });

  if (!allowEmpty && items.length === 0) {
    fail(`"${key}" cannot be an empty array when provided.`);
  }

  return items;
}

export function parseLatLng(value: unknown, key: "lat" | "lng", fieldName: string, fail: Fail): number {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    fail(`"${fieldName}" must be a valid number.`);
  }

  if (key === "lat" && (parsed < -90 || parsed > 90)) {
    fail(`"${fieldName}" must be in range [-90, 90].`);
  }

  if (key === "lng" && (parsed < -180 || parsed > 180)) {
    fail(`"${fieldName}" must be in range [-180, 180].`);
  }

  return parsed;
}

export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function extractPlainText(content: string) {
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

export function extractHeadings(content: string): ContentHeading[] {
  const lines = content.split("\n");
  const headings: ContentHeading[] = [];

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

export function sortByDateKey<T>(dateKey: (item: T) => string) {
  return (a: T, b: T) => +new Date(dateKey(b)) - +new Date(dateKey(a));
}
