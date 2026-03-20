import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export type PostFrontmatter = {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  coverImage: string; // Cloudinary URL
  tags?: string[];
};

export type PostSummary = PostFrontmatter & {
  slug: string;
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

  if (Number.isNaN(Date.parse(rawDate))) {
    failFrontmatter(filePath, `"date" is not a valid calendar date.`);
  }

  return rawDate;
}

function validateCoverImage(rawCoverImage: string, filePath: string): string {
  if (rawCoverImage.startsWith("/") || /^https?:\/\//.test(rawCoverImage)) {
    return rawCoverImage;
  }

  failFrontmatter(filePath, `"coverImage" must be an absolute path (starting with "/") or an http(s) URL.`);
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

function parsePostFrontmatter(data: unknown, filePath: string): PostFrontmatter {
  if (!isObjectRecord(data)) {
    failFrontmatter(filePath, "frontmatter must be an object.");
  }

  const title = readRequiredText(data, "title", filePath);
  const excerpt = readRequiredText(data, "excerpt", filePath);
  const date = validateDate(readRequiredText(data, "date", filePath), filePath);
  const category = readRequiredText(data, "category", filePath);
  const readTime = readRequiredText(data, "readTime", filePath);
  const coverImage = validateCoverImage(readRequiredText(data, "coverImage", filePath), filePath);
  const tags = readOptionalTags(data, filePath);

  return {
    title,
    excerpt,
    date,
    category,
    readTime,
    coverImage,
    tags,
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

  return {
    slug,
    frontmatter: parsePostFrontmatter(data, fullPath),
    content,
    headings: extractHeadings(content),
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
