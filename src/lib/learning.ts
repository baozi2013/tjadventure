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
  readLocale,
  readOptionalLocale,
  readOptionalStringArray,
  readRequiredText,
  sortByDateKey,
  validateAssetPath,
  validateCalendarDate,
  validateContentLocale,
  validateTranslationKey,
  type Fail,
  type RawFrontmatter,
} from "@/lib/content-frontmatter";
import type {
  AdjacentLearningEntries,
  LearningEntry,
  LearningFrontmatter,
  LearningSummary,
} from "@/types/learning";
import type { SearchIndexEntry } from "@/types/search";

const LEARNING_DIR = path.join(process.cwd(), "content/learning");
const LEARNING_EN_DIR = path.join(process.cwd(), "content/en/learning");
const DEFAULT_COVER_IMAGE = "/learning/cover-placeholder.jpg";

function readOptionalCoverImage(frontmatter: RawFrontmatter, fail: Fail): string {
  const value = frontmatter.coverImage;
  if (value == null) return DEFAULT_COVER_IMAGE;

  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`"coverImage" must be a non-empty string when provided.`);
  }

  return validateAssetPath(value.trim(), "coverImage", fail);
}

export function parseLearningFrontmatter(data: unknown, filePath: string, expectedLocale: Locale): LearningFrontmatter {
  const fail: Fail = makeFrontmatterFail("learning", filePath);
  if (!isObjectRecord(data)) {
    fail("frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", fail);
  const excerpt = readRequiredText(data, "excerpt", fail);
  const locale = validateContentLocale(readLocale(data, "locale", fail), expectedLocale, fail);
  const translationKey = validateTranslationKey(readRequiredText(data, "translationKey", fail), fail);
  const canonicalLocale = readOptionalLocale(data, "canonicalLocale", fail);
  const date = validateCalendarDate(readRequiredText(data, "date", fail), "date", fail);
  const coverImage = readOptionalCoverImage(data, fail);
  const tags = readOptionalStringArray(data, "tags", fail);

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

const sortByDate = sortByDateKey<{ date: string }>((item) => item.date);

function readParsedLearningEntry(fullPath: string, slug: string, locale: Locale): LearningEntry {
  return readFileWithMtimeCache(fullPath, () => {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const frontmatter = parseLearningFrontmatter(data, fullPath, locale);

    return {
      slug,
      ...frontmatter,
      content,
      headings: extractContentHeadings(content),
    };
  });
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
