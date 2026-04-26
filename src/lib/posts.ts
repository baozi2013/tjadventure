import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slugFallbackLocations } from "@/data/trip-locations";
import type { TripLocation } from "@/types/posts";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const CATEGORY_FORMAT = /^.+\s·\s.+$/;
const READ_TIME_FORMAT = /^[1-9]\d*\s+min$/;

export type PostFrontmatter = {
  title: string;
  excerpt: string;
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

export type Heading = {
  level: 2 | 3;
  text: string;
  id: string;
};

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

function failFrontmatter(filePath: string, message: string): never {
  throw new Error(`[posts] Invalid frontmatter in "${filePath}": ${message}`);
}

function readRequiredText(frontmatter: RawFrontmatter, key: keyof PostFrontmatter, filePath: string): string {
  const value = frontmatter[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    failFrontmatter(filePath, `"${key}" must be a non-empty string.`);
  }

  return value.trim();
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

function validateLocalPublicAsset(rawPath: string, fieldName: string, filePath: string): string {
  if (!rawPath.startsWith("/")) {
    failFrontmatter(filePath, `"${fieldName}" must start with "/" when using local assets.`);
  }

  if (rawPath.includes("..")) {
    failFrontmatter(filePath, `"${fieldName}" must not contain ".." segments.`);
  }

  const absolutePath = path.join(PUBLIC_DIR, rawPath.slice(1));
  if (!fs.existsSync(absolutePath)) {
    failFrontmatter(filePath, `"${fieldName}" points to missing file: "${rawPath}".`);
  }

  return rawPath;
}

function validateCoverImage(rawCoverImage: string, filePath: string): string {
  if (rawCoverImage.startsWith("/")) {
    return validateLocalPublicAsset(rawCoverImage, "coverImage", filePath);
  }

  if (/^https?:\/\//.test(rawCoverImage)) {
    return rawCoverImage;
  }

  failFrontmatter(filePath, `"coverImage" must be an absolute path (starting with "/") or an http(s) URL.`);
}

function validateLocationImage(rawImage: string, filePath: string, index: number): string {
  if (rawImage.startsWith("/")) {
    return validateLocalPublicAsset(rawImage, `locations[${index}].image`, filePath);
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

function parsePostFrontmatter(data: unknown, filePath: string): PostFrontmatter {
  if (!isObjectRecord(data)) {
    failFrontmatter(filePath, "frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", filePath);
  const excerpt = readRequiredText(data, "excerpt", filePath);
  const date = validateDate(readRequiredText(data, "date", filePath), filePath);
  const category = validateCategory(readRequiredText(data, "category", filePath), filePath);
  const readTime = validateReadTime(readRequiredText(data, "readTime", filePath), filePath);
  const coverImage = validateCoverImage(readRequiredText(data, "coverImage", filePath), filePath);
  const tags = readOptionalTags(data, filePath);
  const locations = readOptionalLocations(data, filePath);

  return {
    title,
    excerpt,
    date,
    category,
    readTime,
    coverImage,
    tags,
    locations,
  };
}

export function getAllPosts(): PostSummary[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fullPath = path.join(POSTS_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(raw);

      return {
        slug,
        ...parsePostFrontmatter(data, fullPath),
      };
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getPostBySlug(slug: string) {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parsePostFrontmatter(data, fullPath);

  return {
    slug,
    frontmatter,
    content,
    headings: extractHeadings(content),
    locations: frontmatter.locations && frontmatter.locations.length > 0
      ? frontmatter.locations
      : (slugFallbackLocations[slug] ?? []),
  };
}

export function getAdjacentPosts(slug: string): AdjacentPosts {
  const posts = getAllPosts();
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
