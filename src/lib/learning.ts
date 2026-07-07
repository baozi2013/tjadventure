import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { isSupportedLocale, routing, type Locale } from "@/i18n/routing";
import { DEFAULT_CONTENT_LOCALE, getLocalizedContentPath } from "@/lib/content-locale";
import type {
  AdjacentLearningEntries,
  LearningEntry,
  LearningFrontmatter,
  LearningHeading,
  LearningSummary,
} from "@/types/learning";
import type { SearchIndexEntry } from "@/types/search";

const LEARNING_DIR = path.join(process.cwd(), "content/learning");
const LEARNING_EN_DIR = path.join(process.cwd(), "content/en/learning");
const DEFAULT_COVER_IMAGE = "/learning/cover-placeholder.jpg";
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const TRANSLATION_KEY_FORMAT = /^[a-z0-9][a-z0-9-]*$/;

type RawFrontmatter = Record<string, unknown>;

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9一-龥\-]/g, "")
    .replace(/-+/g, "-");
}

function isObjectRecord(value: unknown): value is RawFrontmatter {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failLearningFrontmatter(filePath: string, message: string): never {
  throw new Error(`[learning] Invalid frontmatter in "${filePath}": ${message}`);
}

function readRequiredText(frontmatter: RawFrontmatter, key: string, filePath: string): string {
  const value = frontmatter[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    failLearningFrontmatter(filePath, `"${key}" must be a non-empty string.`);
  }

  return value.trim();
}

function readLocale(frontmatter: RawFrontmatter, key: "locale" | "canonicalLocale", filePath: string): Locale {
  const value = readRequiredText(frontmatter, key, filePath);
  if (!isSupportedLocale(value)) {
    failLearningFrontmatter(filePath, `"${key}" must be one of: ${routing.locales.join(", ")}.`);
  }

  return value;
}

function readOptionalLocale(
  frontmatter: RawFrontmatter,
  key: "canonicalLocale",
  filePath: string,
): Locale | undefined {
  if (frontmatter[key] == null) return undefined;
  return readLocale(frontmatter, key, filePath);
}

function validateContentLocale(locale: Locale, expectedLocale: Locale, filePath: string) {
  if (locale !== expectedLocale) {
    failLearningFrontmatter(filePath, `"locale" must match its content directory (${expectedLocale}).`);
  }

  return locale;
}

function validateTranslationKey(rawTranslationKey: string, filePath: string): string {
  if (!TRANSLATION_KEY_FORMAT.test(rawTranslationKey)) {
    failLearningFrontmatter(filePath, `"translationKey" must use lowercase letters, numbers, and hyphens.`);
  }

  return rawTranslationKey;
}

function validateDate(rawDate: string, filePath: string): string {
  if (!DATE_FORMAT.test(rawDate)) {
    failLearningFrontmatter(filePath, `"date" must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = rawDate.split("-").map((value) => Number.parseInt(value, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day
  ) {
    failLearningFrontmatter(filePath, `"date" is not a valid calendar date.`);
  }

  return rawDate;
}

function validateLocalAssetPath(rawPath: string, fieldName: string, filePath: string): string {
  if (!rawPath.startsWith("/")) {
    failLearningFrontmatter(filePath, `"${fieldName}" must start with "/" when using local assets.`);
  }

  if (rawPath.startsWith("//")) {
    failLearningFrontmatter(filePath, `"${fieldName}" must not use protocol-relative URLs.`);
  }

  if (rawPath.includes("..")) {
    failLearningFrontmatter(filePath, `"${fieldName}" must not contain ".." segments.`);
  }

  return rawPath;
}

function readOptionalCoverImage(frontmatter: RawFrontmatter, filePath: string): string {
  const value = frontmatter.coverImage;
  if (value == null) return DEFAULT_COVER_IMAGE;

  if (typeof value !== "string" || value.trim().length === 0) {
    failLearningFrontmatter(filePath, `"coverImage" must be a non-empty string when provided.`);
  }

  const coverImage = value.trim();
  if (coverImage.startsWith("/")) {
    return validateLocalAssetPath(coverImage, "coverImage", filePath);
  }

  if (/^https?:\/\//.test(coverImage)) {
    return coverImage;
  }

  failLearningFrontmatter(filePath, `"coverImage" must be an absolute path (starting with "/") or an http(s) URL.`);
}

function readOptionalTags(frontmatter: RawFrontmatter, filePath: string): string[] | undefined {
  const value = frontmatter.tags;
  if (value == null) return undefined;

  if (!Array.isArray(value)) {
    failLearningFrontmatter(filePath, `"tags" must be an array of strings when provided.`);
  }

  const tags = value.map((tag) => {
    if (typeof tag !== "string" || tag.trim().length === 0) {
      failLearningFrontmatter(filePath, `"tags" entries must be non-empty strings.`);
    }
    return tag.trim();
  });

  return tags;
}

function parseLearningFrontmatter(data: unknown, filePath: string, expectedLocale: Locale): LearningFrontmatter {
  if (!isObjectRecord(data)) {
    failLearningFrontmatter(filePath, "frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", filePath);
  const excerpt = readRequiredText(data, "excerpt", filePath);
  const locale = validateContentLocale(readLocale(data, "locale", filePath), expectedLocale, filePath);
  const translationKey = validateTranslationKey(readRequiredText(data, "translationKey", filePath), filePath);
  const canonicalLocale = readOptionalLocale(data, "canonicalLocale", filePath);
  const date = validateDate(readRequiredText(data, "date", filePath), filePath);
  const coverImage = readOptionalCoverImage(data, filePath);
  const tags = readOptionalTags(data, filePath);

  return {
    title,
    excerpt,
    locale,
    translationKey,
    canonicalLocale,
    date,
    coverImage,
    tags,
  };
}

function getLearningDirectory(locale: Locale) {
  return locale === "en-US" ? LEARNING_EN_DIR : LEARNING_DIR;
}

function getLearningFilenames(locale: Locale = DEFAULT_CONTENT_LOCALE) {
  const learningDir = getLearningDirectory(locale);
  if (!fs.existsSync(learningDir)) return [];

  return fs.readdirSync(learningDir).filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
}

function getLearningPath(fileName: string, locale: Locale) {
  return getLocalizedContentPath(LEARNING_DIR, LEARNING_EN_DIR, fileName, locale, { fallbackToDefault: false });
}

function sortByDate<T extends { date: string }>(a: T, b: T) {
  return +new Date(b.date) - +new Date(a.date);
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

function extractHeadings(content: string): LearningHeading[] {
  const lines = content.split("\n");
  const headings: LearningHeading[] = [];

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

function readParsedLearningEntry(fullPath: string, slug: string, locale: Locale): LearningEntry {
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseLearningFrontmatter(data, fullPath, locale);

  return {
    slug,
    ...frontmatter,
    content,
    headings: extractHeadings(content),
  };
}

export function getAllLearningEntries(locale: Locale = DEFAULT_CONTENT_LOCALE): LearningSummary[] {
  return getLearningFilenames(locale)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getLearningPath(file, locale);
      const entry = readParsedLearningEntry(fullPath, slug, locale);

      return {
        slug: entry.slug,
        title: entry.title,
        excerpt: entry.excerpt,
        locale: entry.locale,
        translationKey: entry.translationKey,
        canonicalLocale: entry.canonicalLocale,
        date: entry.date,
        coverImage: entry.coverImage,
        tags: entry.tags,
      };
    })
    .sort(sortByDate);
}

export function getLearningEntryBySlug(slug: string, locale: Locale = DEFAULT_CONTENT_LOCALE) {
  const fileName = `${slug}.mdx`;
  const fullPath = getLearningPath(fileName, locale);
  if (!fs.existsSync(fullPath)) return null;

  return readParsedLearningEntry(fullPath, slug, locale);
}

export function getAdjacentLearningEntries(
  slug: string,
  locale: Locale = DEFAULT_CONTENT_LOCALE,
): AdjacentLearningEntries {
  const entries = getAllLearningEntries(locale);
  const currentIndex = entries.findIndex((entry) => entry.slug === slug);

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
    };
  }

  return {
    previous: entries[currentIndex - 1] ?? null,
    next: entries[currentIndex + 1] ?? null,
  };
}

export function getLearningSearchIndex(locale: Locale = DEFAULT_CONTENT_LOCALE): SearchIndexEntry[] {
  return getLearningFilenames(locale)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getLearningPath(file, locale);
      const entry = readParsedLearningEntry(fullPath, slug, locale);
      const headings = entry.headings.map((heading) => heading.text);
      const tags = entry.tags ?? [];
      const body = extractPlainText(entry.content);
      const searchText = normalizeText(
        [entry.title, entry.excerpt, tags.join(" "), headings.join(" "), body].join(" ").toLowerCase(),
      );

      return {
        slug: entry.slug,
        locale: entry.locale,
        translationKey: entry.translationKey,
        href: `/learning/${entry.slug}`,
        title: entry.title,
        excerpt: entry.excerpt,
        category: "Learning · Godot",
        region: "Learning",
        date: entry.date,
        readTime: "Journal entry",
        coverImage: entry.coverImage,
        tags,
        headings,
        locations: [],
        body,
        searchText,
      };
    })
    .sort(sortByDate);
}

export function getLearningLanguageAlternates(translationKey: string): Partial<Record<Locale, string>> {
  return Object.fromEntries(
    routing.locales.flatMap((locale) =>
      getAllLearningEntries(locale)
        .filter((entry) => entry.translationKey === translationKey)
        .map((entry) => [locale, `/learning/${entry.slug}`] as const),
    ),
  ) as Partial<Record<Locale, string>>;
}
