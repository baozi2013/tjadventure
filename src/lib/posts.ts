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

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, "")
    .replace(/-+/g, "-");
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
        ...(data as PostFrontmatter),
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
    frontmatter: data as PostFrontmatter,
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
