import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getSlugFallbackLocations, localizeTripLocations } from "@/data/trip-locations";
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
  readRequiredText,
  sortByDateKey,
  validateAssetPath,
  validateCalendarDate,
  validateContentLocale,
  validateTranslationKey,
  type ContentHeading,
  type Fail,
  type RawFrontmatter,
} from "@/lib/content-frontmatter";
import type { SearchIndexEntry } from "@/types/search";
import type { TripLocation } from "@/types/posts";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const POSTS_EN_DIR = path.join(process.cwd(), "content/en/posts");
const CATEGORY_FORMAT = /^.+\s·\s.+$/;
const READ_TIME_FORMAT = /^[1-9]\d*\s+min$/;

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
  featured?: boolean;
  featuredOrder?: number;
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

export type Heading = ContentHeading;

type ParsedPost = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  headings: Heading[];
  locations: TripLocation[];
};

function validateCategory(rawCategory: string, fail: Fail): string {
  if (!CATEGORY_FORMAT.test(rawCategory)) {
    fail(`"category" must follow "Region · Theme" format.`);
  }

  return rawCategory;
}

function validateReadTime(rawReadTime: string, fail: Fail): string {
  if (!READ_TIME_FORMAT.test(rawReadTime)) {
    fail(`"readTime" must follow "<number> min" format (for example, "8 min").`);
  }

  return rawReadTime;
}

function readOptionalLocations(frontmatter: RawFrontmatter, fail: Fail): TripLocation[] | undefined {
  const value = frontmatter.locations;
  if (value == null) return undefined;

  if (!Array.isArray(value)) {
    fail(`"locations" must be an array when provided.`);
  }

  const locations = value.map((item, index) => {
    if (!isObjectRecord(item)) {
      fail(`"locations[${index}]" must be an object.`);
    }

    const name = item.name;
    if (typeof name !== "string" || name.trim().length === 0) {
      fail(`"locations[${index}].name" must be a non-empty string.`);
    }

    const note = item.note;
    if (note != null && (typeof note !== "string" || note.trim().length === 0)) {
      fail(`"locations[${index}].note" must be a non-empty string when provided.`);
    }

    const image = item.image;
    if (image != null && (typeof image !== "string" || image.trim().length === 0)) {
      fail(`"locations[${index}].image" must be a non-empty string when provided.`);
    }

    return {
      name: name.trim(),
      lat: parseLatLng(item.lat, "lat", `locations[${index}].lat`, fail),
      lng: parseLatLng(item.lng, "lng", `locations[${index}].lng`, fail),
      note: typeof note === "string" ? note.trim() : undefined,
      image:
        typeof image === "string" ? validateAssetPath(image.trim(), `locations[${index}].image`, fail) : undefined,
    };
  });

  if (locations.length === 0) {
    fail(`"locations" cannot be an empty array.`);
  }

  return locations;
}

function readOptionalBoolean(frontmatter: RawFrontmatter, key: string, fail: Fail): boolean | undefined {
  const value = frontmatter[key];
  if (value == null) return undefined;

  if (typeof value !== "boolean") {
    fail(`"${key}" must be a boolean when provided.`);
  }

  return value;
}

function readOptionalInteger(frontmatter: RawFrontmatter, key: string, fail: Fail): number | undefined {
  const value = frontmatter[key];
  if (value == null) return undefined;

  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(`"${key}" must be an integer when provided.`);
  }

  return value;
}

export function parsePostFrontmatter(data: unknown, filePath: string, expectedLocale: Locale): PostFrontmatter {
  const fail: Fail = makeFrontmatterFail("posts", filePath);
  if (!isObjectRecord(data)) {
    fail("frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", fail);
  const excerpt = readRequiredText(data, "excerpt", fail);
  const locale = validateContentLocale(readLocale(data, "locale", fail), expectedLocale, fail);
  const translationKey = validateTranslationKey(readRequiredText(data, "translationKey", fail), fail);
  const canonicalLocale = readOptionalLocale(data, "canonicalLocale", fail);
  const date = validateCalendarDate(readRequiredText(data, "date", fail), "date", fail);
  const category = validateCategory(readRequiredText(data, "category", fail), fail);
  const readTime = validateReadTime(readRequiredText(data, "readTime", fail), fail);
  const coverImage = validateAssetPath(readRequiredText(data, "coverImage", fail), "coverImage", fail);
  const tags = readOptionalStringArray(data, "tags", fail);
  const locations = readOptionalLocations(data, fail);
  const featured = readOptionalBoolean(data, "featured", fail);
  const featuredOrder = readOptionalInteger(data, "featuredOrder", fail);

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
    featured,
    featuredOrder,
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
  return readFileWithMtimeCache(fullPath, () => {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const frontmatter = parsePostFrontmatter(data, fullPath, locale);

    return {
      slug,
      frontmatter,
      content,
      headings: extractContentHeadings(content),
      locations: resolvePostLocations(slug, frontmatter, locale),
    };
  });
}

const sortByDate = sortByDateKey<{ date: string }>((item) => item.date);

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
