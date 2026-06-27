import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getSlugFallbackLocations, localizeTripLocations } from "@/data/trip-locations";
import { isSupportedLocale, routing, type Locale } from "@/i18n/routing";
import { DEFAULT_CONTENT_LOCALE, getLocalizedContentPath } from "@/lib/content-locale";
import type { SearchIndexEntry } from "@/types/search";
import type { TripLocation } from "@/types/posts";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const POSTS_EN_DIR = path.join(process.cwd(), "content/en/posts");
const CATEGORY_FORMAT = /^.+\s·\s.+$/;
const READ_TIME_FORMAT = /^[1-9]\d*\s+min$/;
const TRANSLATION_KEY_FORMAT = /^[a-z0-9][a-z0-9-]*$/;

export type PostFrontmatter = {
  title: string;
  excerpt: string;
  locale: Locale;
  translationKey: string;
  canonicalLocale?: Locale;
  date: string;
  category: string;
  readTime: string;
  coverImage: string; // Cloudinary URL
  tags?: string[];
  locations?: TripLocation[];
};

export type PostSummary = PostFrontmatter & {
  slug: string;
};

export type AdjacentPosts = {
  previous: PostSummary | null;
  next: PostSummary | null;
};

export type RelatedPost = PostSummary & {
  relation: "same-category" | "same-region" | "shared-tags" | "recent";
};

export type Heading = {
  level: 2 | 3;
  text: string;
  id: string;
};

type RawFrontmatter = Record<string, unknown>;
type ParsedPost = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  headings: Heading[];
  locations: TripLocation[];
};

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

function failFrontmatter(filePath: string, message: string): never {
  throw new Error(`[posts] Invalid frontmatter in "${filePath}": ${message}`);
}

function readRequiredText(frontmatter: RawFrontmatter, key: string, filePath: string): string {
  const value = frontmatter[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    failFrontmatter(filePath, `"${key}" must be a non-empty string.`);
  }

  return value.trim();
}

function readLocale(frontmatter: RawFrontmatter, key: "locale" | "canonicalLocale", filePath: string): Locale {
  const value = readRequiredText(frontmatter, key, filePath);
  if (!isSupportedLocale(value)) {
    failFrontmatter(filePath, `"${key}" must be one of: ${routing.locales.join(", ")}.`);
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
    failFrontmatter(filePath, `"locale" must match its content directory (${expectedLocale}).`);
  }

  return locale;
}

function validateTranslationKey(rawTranslationKey: string, filePath: string): string {
  if (!TRANSLATION_KEY_FORMAT.test(rawTranslationKey)) {
    failFrontmatter(filePath, `"translationKey" must use lowercase letters, numbers, and hyphens.`);
  }

  return rawTranslationKey;
}

function validateDate(rawDate: string, filePath: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    failFrontmatter(filePath, `"date" must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = rawDate.split("-").map((value) => Number.parseInt(value, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day
  ) {
    failFrontmatter(filePath, `"date" is not a valid calendar date.`);
  }

  return rawDate;
}

function validateCategory(rawCategory: string, filePath: string): string {
  if (!CATEGORY_FORMAT.test(rawCategory)) {
    failFrontmatter(filePath, `"category" must follow "Region · Theme" format.`);
  }

  return rawCategory;
}

function validateReadTime(rawReadTime: string, filePath: string): string {
  if (!READ_TIME_FORMAT.test(rawReadTime)) {
    failFrontmatter(filePath, `"readTime" must follow "<number> min" format (for example, "8 min").`);
  }

  return rawReadTime;
}

// Build-time validation checks that referenced public assets exist.
// At runtime we only validate the path shape so route traces do not pull `public/` into server bundles.
function validateLocalAssetPath(rawPath: string, fieldName: string, filePath: string): string {
  if (!rawPath.startsWith("/")) {
    failFrontmatter(filePath, `"${fieldName}" must start with "/" when using local assets.`);
  }

  if (rawPath.startsWith("//")) {
    failFrontmatter(filePath, `"${fieldName}" must not use protocol-relative URLs.`);
  }

  if (rawPath.includes("..")) {
    failFrontmatter(filePath, `"${fieldName}" must not contain ".." segments.`);
  }

  return rawPath;
}

function validateCoverImage(rawCoverImage: string, filePath: string): string {
  if (rawCoverImage.startsWith("/")) {
    return validateLocalAssetPath(rawCoverImage, "coverImage", filePath);
  }

  if (/^https?:\/\//.test(rawCoverImage)) {
    return rawCoverImage;
  }

  failFrontmatter(filePath, `"coverImage" must be an absolute path (starting with "/") or an http(s) URL.`);
}

function validateLocationImage(rawImage: string, filePath: string, index: number): string {
  if (rawImage.startsWith("/")) {
    return validateLocalAssetPath(rawImage, `locations[${index}].image`, filePath);
  }

  if (/^https?:\/\//.test(rawImage)) {
    return rawImage;
  }

  failFrontmatter(
    filePath,
    `"locations[${index}].image" must be an absolute path (starting with "/") or an http(s) URL.`,
  );
}

function readOptionalTags(frontmatter: RawFrontmatter, filePath: string): string[] | undefined {
  const value = frontmatter.tags;
  if (value == null) return undefined;

  if (!Array.isArray(value)) {
    failFrontmatter(filePath, `"tags" must be an array of strings when provided.`);
  }

  const tags = value.map((tag) => {
    if (typeof tag !== "string" || tag.trim().length === 0) {
      failFrontmatter(filePath, `"tags" entries must be non-empty strings.`);
    }
    return tag.trim();
  });

  return tags;
}

function readLocationNumber(
  location: RawFrontmatter,
  key: "lat" | "lng",
  filePath: string,
  index: number,
): number {
  const value = location[key];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    failFrontmatter(filePath, `"locations[${index}].${key}" must be a valid number.`);
  }

  if (key === "lat" && (parsed < -90 || parsed > 90)) {
    failFrontmatter(filePath, `"locations[${index}].lat" must be in range [-90, 90].`);
  }

  if (key === "lng" && (parsed < -180 || parsed > 180)) {
    failFrontmatter(filePath, `"locations[${index}].lng" must be in range [-180, 180].`);
  }

  return parsed;
}

function readOptionalLocations(frontmatter: RawFrontmatter, filePath: string): TripLocation[] | undefined {
  const value = frontmatter.locations;
  if (value == null) return undefined;

  if (!Array.isArray(value)) {
    failFrontmatter(filePath, `"locations" must be an array when provided.`);
  }

  const locations = value.map((item, index) => {
    if (!isObjectRecord(item)) {
      failFrontmatter(filePath, `"locations[${index}]" must be an object.`);
    }

    const name = item.name;
    if (typeof name !== "string" || name.trim().length === 0) {
      failFrontmatter(filePath, `"locations[${index}].name" must be a non-empty string.`);
    }

    const note = item.note;
    if (note != null && (typeof note !== "string" || note.trim().length === 0)) {
      failFrontmatter(filePath, `"locations[${index}].note" must be a non-empty string when provided.`);
    }

    const image = item.image;
    if (image != null && (typeof image !== "string" || image.trim().length === 0)) {
      failFrontmatter(filePath, `"locations[${index}].image" must be a non-empty string when provided.`);
    }

    return {
      name: name.trim(),
      lat: readLocationNumber(item, "lat", filePath, index),
      lng: readLocationNumber(item, "lng", filePath, index),
      note: typeof note === "string" ? note.trim() : undefined,
      image: typeof image === "string" ? validateLocationImage(image.trim(), filePath, index) : undefined,
    };
  });

  if (locations.length === 0) {
    failFrontmatter(filePath, `"locations" cannot be an empty array.`);
  }

  return locations;
}

function parsePostFrontmatter(data: unknown, filePath: string, expectedLocale: Locale): PostFrontmatter {
  if (!isObjectRecord(data)) {
    failFrontmatter(filePath, "frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", filePath);
  const excerpt = readRequiredText(data, "excerpt", filePath);
  const locale = validateContentLocale(readLocale(data, "locale", filePath), expectedLocale, filePath);
  const translationKey = validateTranslationKey(readRequiredText(data, "translationKey", filePath), filePath);
  const canonicalLocale = readOptionalLocale(data, "canonicalLocale", filePath);
  const date = validateDate(readRequiredText(data, "date", filePath), filePath);
  const category = validateCategory(readRequiredText(data, "category", filePath), filePath);
  const readTime = validateReadTime(readRequiredText(data, "readTime", filePath), filePath);
  const coverImage = validateCoverImage(readRequiredText(data, "coverImage", filePath), filePath);
  const tags = readOptionalTags(data, filePath);
  const locations = readOptionalLocations(data, filePath);

  return {
    title,
    excerpt,
    locale,
    translationKey,
    canonicalLocale,
    date,
    category,
    readTime,
    coverImage,
    tags,
    locations,
  };
}

function getPostDirectory(locale: Locale) {
  return locale === "en-US" ? POSTS_EN_DIR : POSTS_DIR;
}

function getPostFilenames(locale: Locale = DEFAULT_CONTENT_LOCALE) {
  const postsDir = getPostDirectory(locale);
  if (!fs.existsSync(postsDir)) return [];

  return fs.readdirSync(postsDir).filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));
}

function resolvePostLocations(slug: string, frontmatter: PostFrontmatter, locale: Locale) {
  return frontmatter.locations && frontmatter.locations.length > 0
    ? localizeTripLocations(frontmatter.locations, locale)
    : getSlugFallbackLocations(slug, locale);
}

function getPostPath(fileName: string, locale: Locale) {
  return getLocalizedContentPath(POSTS_DIR, POSTS_EN_DIR, fileName, locale, { fallbackToDefault: false });
}

function readParsedPost(fullPath: string, slug: string, locale: Locale): ParsedPost {
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parsePostFrontmatter(data, fullPath, locale);

  return {
    slug,
    frontmatter,
    content,
    headings: extractHeadings(content),
    locations: resolvePostLocations(slug, frontmatter, locale),
  };
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

export function getAllPosts(locale: Locale = DEFAULT_CONTENT_LOCALE): PostSummary[] {
  return getPostFilenames(locale)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getPostPath(file, locale);
      const post = readParsedPost(fullPath, slug, locale);

      return {
        slug: post.slug,
        ...post.frontmatter,
      };
    })
    .sort(sortByDate);
}

export function getPostBySlug(slug: string, locale: Locale = DEFAULT_CONTENT_LOCALE) {
  const fileName = `${slug}.mdx`;
  const fullPath = getPostPath(fileName, locale);
  if (!fs.existsSync(fullPath)) return null;

  const post = readParsedPost(fullPath, slug, locale);

  return {
    slug: post.slug,
    frontmatter: post.frontmatter,
    content: post.content,
    headings: post.headings,
    locations: post.locations,
  };
}

export function getAdjacentPosts(slug: string, locale: Locale = DEFAULT_CONTENT_LOCALE): AdjacentPosts {
  const posts = getAllPosts(locale);
  const currentIndex = posts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
    };
  }

  return {
    previous: posts[currentIndex - 1] ?? null,
    next: posts[currentIndex + 1] ?? null,
  };
}

function getPostRegion(post: Pick<PostSummary, "category">) {
  return post.category.split(" · ")[0];
}

function getTagOverlapScore(currentTags: Set<string>, candidateTags: string[] | undefined) {
  if (!candidateTags || candidateTags.length === 0) return 0;

  return candidateTags.reduce((score, tag) => score + (currentTags.has(tag) ? 1 : 0), 0);
}

export function getRelatedPosts(slug: string, limit = 3, locale: Locale = DEFAULT_CONTENT_LOCALE): RelatedPost[] {
  const current = getAllPosts(locale).find((post) => post.slug === slug);
  if (!current) return [];

  const currentTags = new Set(current.tags ?? []);
  const currentRegion = getPostRegion(current);
  const candidates = getAllPosts(locale).filter((post) => post.slug !== slug);

  const ranked = candidates
    .map((post) => {
      const sameCategory = post.category === current.category;
      const sameRegion = getPostRegion(post) === currentRegion;
      const tagOverlap = getTagOverlapScore(currentTags, post.tags);
      const score = (sameCategory ? 80 : 0) + (sameRegion ? 30 : 0) + tagOverlap * 15;
      const relation: RelatedPost["relation"] = sameCategory
        ? "same-category"
        : tagOverlap > 0
          ? "shared-tags"
          : sameRegion
            ? "same-region"
            : "recent";

      return {
        post,
        relation,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || +new Date(b.post.date) - +new Date(a.post.date));

  const related = ranked.filter((item) => item.score > 0).slice(0, limit);

  if (related.length < limit) {
    const selectedSlugs = new Set(related.map((item) => item.post.slug));
    const fallback = ranked
      .filter((item) => item.score === 0 && !selectedSlugs.has(item.post.slug))
      .slice(0, limit - related.length);
    related.push(...fallback);
  }

  return related.map(({ post, relation }) => ({
    ...post,
    relation,
  }));
}

export function getSearchIndex(locale: Locale = DEFAULT_CONTENT_LOCALE): SearchIndexEntry[] {
  return getPostFilenames(locale)
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = getPostPath(file, locale);
      const post = readParsedPost(fullPath, slug, locale);
      const region = post.frontmatter.category.split(" · ")[0];
      const body = extractPlainText(post.content);
      const headings = post.headings.map((heading) => heading.text);
      const locations = post.locations.map((location) => normalizeText(`${location.name} ${location.note ?? ""}`));
      const tags = post.frontmatter.tags ?? [];
      const searchText = normalizeText(
        [
          post.frontmatter.title,
          post.frontmatter.excerpt,
          post.frontmatter.category,
          tags.join(" "),
          headings.join(" "),
          locations.join(" "),
          body,
        ].join(" ").toLowerCase(),
      );

      return {
        slug: post.slug,
        locale: post.frontmatter.locale,
        translationKey: post.frontmatter.translationKey,
        href: `/posts/${post.slug}`,
        title: post.frontmatter.title,
        excerpt: post.frontmatter.excerpt,
        category: post.frontmatter.category,
        region,
        date: post.frontmatter.date,
        readTime: post.frontmatter.readTime,
        coverImage: post.frontmatter.coverImage,
        tags,
        headings,
        locations,
        body,
        searchText,
      };
    })
    .sort(sortByDate);
}

export function getPostLanguageAlternates(translationKey: string): Partial<Record<Locale, string>> {
  return Object.fromEntries(
    routing.locales.flatMap((locale) =>
      getAllPosts(locale)
        .filter((post) => post.translationKey === translationKey)
        .map((post) => [locale, `/posts/${post.slug}`] as const),
    ),
  ) as Partial<Record<Locale, string>>;
}

function extractHeadings(content: string): Heading[] {
  const lines = content.split("\n");
  const headings: Heading[] = [];

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
