import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT_DIR = process.cwd();
const CYCLING_DIR = path.join(ROOT_DIR, "content", "cycling");
const DRAFTS_DIR = path.join(CYCLING_DIR, "_drafts");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const TODO_PATTERN = /\bTODO\b|\/trips\/TODO\//i;

function usage() {
  return `Usage:
  npm run review:strava-cycling -- [options]

Options:
  --slug <slug>      Review one draft by slug.
  --json             Print machine-readable JSON.
  --strict           Exit non-zero when any reviewed draft still needs work.
  --help             Show this help.

The review checkpoint checks draft TODOs, missing local assets, duplicate Strava
activity URLs, and whether a draft appears ready for human promotion. It never
publishes files automatically.`;
}

function readOptionValue(args, index, optionName) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function parseArguments(args) {
  const options = {
    slug: "",
    json: false,
    strict: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (argument === "--strict") {
      options.strict = true;
      continue;
    }
    if (argument === "--slug") {
      options.slug = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

async function listMdxFiles(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx") && !entry.name.startsWith("_"))
      .map((entry) => path.join(directory, entry.name));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function getActivityIdFromStravaUrl(rawUrl) {
  if (typeof rawUrl !== "string") return "";

  try {
    const url = new URL(rawUrl);
    const match = url.pathname.match(/^\/activities\/(\d+)(?:\/|$)/);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

async function readParsedMdx(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  return {
    raw,
    data: parsed.data,
    content: parsed.content,
  };
}

async function getPublishedStravaActivityIds() {
  const activityIds = new Map();
  const publishedFiles = await listMdxFiles(CYCLING_DIR);

  for (const filePath of publishedFiles) {
    const { data } = await readParsedMdx(filePath);
    const activityId = getActivityIdFromStravaUrl(data.stravaUrl);
    if (activityId) {
      activityIds.set(activityId, path.relative(ROOT_DIR, filePath));
    }
  }

  return activityIds;
}

function flattenFrontmatter(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenFrontmatter(item, `${prefix}[${index}]`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => flattenFrontmatter(child, prefix ? `${prefix}.${key}` : key));
  }

  return [
    {
      path: prefix,
      value,
    },
  ];
}

async function localAssetExists(rawPath) {
  if (typeof rawPath !== "string" || !rawPath.startsWith("/") || rawPath.includes("..")) return false;

  try {
    await fs.access(path.join(PUBLIC_DIR, rawPath.slice(1)));
    return true;
  } catch {
    return false;
  }
}

async function reviewDraft(filePath, publishedActivityIds, seenDraftActivityIds) {
  const { raw, data } = await readParsedMdx(filePath);
  const slug = path.basename(filePath, ".mdx");
  const relativePath = path.relative(ROOT_DIR, filePath);
  const activityId = getActivityIdFromStravaUrl(data.stravaUrl);
  const issues = [];
  const warnings = [];

  for (const item of flattenFrontmatter(data)) {
    if (typeof item.value === "string" && TODO_PATTERN.test(item.value)) {
      issues.push(`Frontmatter ${item.path} still has TODO content.`);
    }
  }

  if (TODO_PATTERN.test(raw)) {
    issues.push("Body still has TODO markers.");
  }

  if (!activityId) {
    issues.push("Missing valid Strava activity URL.");
  } else if (publishedActivityIds.has(activityId)) {
    issues.push(`Activity ${activityId} is already published in ${publishedActivityIds.get(activityId)}.`);
  } else if (seenDraftActivityIds.has(activityId)) {
    issues.push(`Activity ${activityId} is duplicated by draft ${seenDraftActivityIds.get(activityId)}.`);
  } else {
    seenDraftActivityIds.set(activityId, relativePath);
  }

  if (typeof data.coverImage !== "string" || data.coverImage.trim().length === 0) {
    issues.push("Missing coverImage.");
  } else if (data.coverImage.startsWith("/") && !(await localAssetExists(data.coverImage))) {
    issues.push(`coverImage points to a missing local asset: ${data.coverImage}.`);
  }

  if (!Array.isArray(data.tags) || data.tags.length < 2) {
    warnings.push("Consider adding specific tags beyond cycling.");
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    warnings.push("No gallery images are attached yet.");
  }

  return {
    slug,
    path: relativePath,
    activityId,
    ready: issues.length === 0,
    issues,
    warnings,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const publishedActivityIds = await getPublishedStravaActivityIds();
  let draftFiles = await listMdxFiles(DRAFTS_DIR);
  if (options.slug) {
    draftFiles = draftFiles.filter((filePath) => path.basename(filePath, ".mdx") === options.slug);
  }

  const seenDraftActivityIds = new Map();
  const results = [];
  for (const filePath of draftFiles) {
    results.push(await reviewDraft(filePath, publishedActivityIds, seenDraftActivityIds));
  }

  if (options.json) {
    console.log(JSON.stringify({ drafts: results }, null, 2));
  } else if (results.length === 0) {
    console.log("[review-strava-cycling] No drafts found.");
  } else {
    for (const result of results) {
      const status = result.ready ? "ready" : "needs-review";
      console.log(`[review-strava-cycling] ${status}: ${result.path}`);
      for (const issue of result.issues) console.log(`  - issue: ${issue}`);
      for (const warning of result.warnings) console.log(`  - warning: ${warning}`);
    }
  }

  if (options.strict && results.some((result) => !result.ready)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[review-strava-cycling] ${error.message}`);
  console.error(usage());
  process.exitCode = 1;
});
