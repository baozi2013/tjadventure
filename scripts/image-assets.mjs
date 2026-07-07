import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const CONTENT_DIRS = [
  "content/posts",
  "content/en/posts",
  "content/cycling",
  "content/en/cycling",
  "content/learning",
  "content/en/learning",
].map((directory) => path.join(ROOT_DIR, directory));
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_MAX_WIDTH = 2000;
const DEFAULT_QUALITY = 78;
const DEFAULT_OUTPUT_ROOT = "/optimized";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const OPTIMIZABLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function usage() {
  return `Usage:
  npm run audit:images
  npm run check:images
  npm run optimize:images -- [options]

Commands:
  audit       Report referenced local image assets and budget status. (default)
  optimize    Generate optimized derivatives for over-budget referenced images.

Options:
  --max-size-mb <number>      Referenced image budget in MB. (default: ${DEFAULT_MAX_SIZE_MB})
  --fail-on-over-budget       Exit non-zero when referenced images exceed the budget.
  --json                      Print machine-readable JSON.
  --limit <number>            Limit optimized image count. 0 means no limit. (default: 0)
  --max-width <pixels>        Resize optimized derivatives to this max width. (default: ${DEFAULT_MAX_WIDTH})
  --quality <1-100>           WebP quality for optimized derivatives. (default: ${DEFAULT_QUALITY})
  --output-root <path>        Public output root for derivatives. (default: ${DEFAULT_OUTPUT_ROOT})
  --write                     Actually write optimized derivative files.
  --replace-references        After writing, replace content references with derivative paths.
  --help                      Show this help.

Notes:
  - Only local image paths referenced by content frontmatter or MDX are audited.
  - optimize is dry-run by default; pass --write to create files.
  - Original images are never deleted.`;
}

function readOptionValue(args, index, optionName) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }
  return value;
}

function readPositiveNumber(rawValue, optionName) {
  const value = Number.parseFloat(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${optionName} must be a positive number.`);
  }
  return value;
}

function readPositiveInteger(rawValue, optionName, { allowZero = false } = {}) {
  const value = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(`${optionName} must be ${allowZero ? "zero or " : ""}a positive integer.`);
  }
  return value;
}

function parseArguments(args) {
  const options = {
    command: "audit",
    maxSizeMb: DEFAULT_MAX_SIZE_MB,
    failOnOverBudget: false,
    json: false,
    limit: 0,
    maxWidth: DEFAULT_MAX_WIDTH,
    quality: DEFAULT_QUALITY,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    write: false,
    replaceReferences: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }

    if (argument === "audit" || argument === "optimize") {
      options.command = argument;
      continue;
    }

    if (argument === "--fail-on-over-budget") {
      options.failOnOverBudget = true;
      continue;
    }

    if (argument === "--json") {
      options.json = true;
      continue;
    }

    if (argument === "--write") {
      options.write = true;
      continue;
    }

    if (argument === "--replace-references") {
      options.replaceReferences = true;
      continue;
    }

    if (argument === "--max-size-mb") {
      options.maxSizeMb = readPositiveNumber(readOptionValue(args, index, argument), argument);
      index += 1;
      continue;
    }

    if (argument === "--limit") {
      options.limit = readPositiveInteger(readOptionValue(args, index, argument), argument, { allowZero: true });
      index += 1;
      continue;
    }

    if (argument === "--max-width") {
      options.maxWidth = readPositiveInteger(readOptionValue(args, index, argument), argument);
      index += 1;
      continue;
    }

    if (argument === "--quality") {
      options.quality = readPositiveInteger(readOptionValue(args, index, argument), argument);
      if (options.quality > 100) {
        throw new Error("--quality must be between 1 and 100.");
      }
      index += 1;
      continue;
    }

    if (argument === "--output-root") {
      options.outputRoot = normalizePublicRoot(readOptionValue(args, index, argument));
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (options.replaceReferences && !options.write) {
    throw new Error("--replace-references requires --write.");
  }

  return {
    ...options,
    maxSizeBytes: Math.round(options.maxSizeMb * 1024 * 1024),
  };
}

function normalizePublicRoot(rawPath) {
  const trimmedPath = rawPath.trim();
  if (!trimmedPath || !trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    throw new Error("--output-root must be a local public path that starts with one slash.");
  }

  if (trimmedPath.includes("..")) {
    throw new Error("--output-root must not contain '..' segments.");
  }

  return trimmedPath === "/" ? "" : trimmedPath.replace(/\/$/, "");
}

function isLocalImageReference(value) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("..")) return false;

  return IMAGE_EXTENSIONS.has(path.extname(value).toLowerCase());
}

function isOptimizable(publicPath) {
  return OPTIMIZABLE_EXTENSIONS.has(path.extname(publicPath).toLowerCase());
}

async function listContentFiles(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith("_")) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listContentFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function addReference(records, publicPath, filePath, source) {
  if (!isLocalImageReference(publicPath)) return;

  const existing = records.get(publicPath) ?? {
    publicPath,
    absolutePath: path.join(PUBLIC_DIR, publicPath.slice(1)),
    uses: [],
  };
  existing.uses.push({
    file: path.relative(ROOT_DIR, filePath),
    source,
  });
  records.set(publicPath, existing);
}

function visitFrontmatter(value, records, filePath, keyPath = []) {
  if (typeof value === "string") {
    addReference(records, value.trim(), filePath, keyPath.join(".") || "frontmatter");
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitFrontmatter(item, records, filePath, [...keyPath, `[${index}]`]);
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      visitFrontmatter(item, records, filePath, [...keyPath, key]);
    });
  }
}

function readMdxImageReferences(content, records, filePath) {
  const imagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

  for (const match of content.matchAll(imagePattern)) {
    addReference(records, match[1], filePath, "mdx-image");
  }
}

async function scanReferencedImages(maxSizeBytes, outputRoot) {
  const records = new Map();
  const contentFiles = (await Promise.all(CONTENT_DIRS.map(listContentFiles))).flat();

  for (const filePath of contentFiles) {
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    visitFrontmatter(data, records, filePath);
    readMdxImageReferences(content, records, filePath);
  }

  const enrichedRecords = await Promise.all(
    Array.from(records.values()).map(async (record) => {
      let stat = null;
      try {
        stat = await fs.stat(record.absolutePath);
      } catch (error) {
        if (!error || error.code !== "ENOENT") throw error;
      }

      return {
        ...record,
        exists: Boolean(stat),
        sizeBytes: stat?.size ?? 0,
        overBudget: Boolean(stat && stat.size > maxSizeBytes),
        optimizable: isOptimizable(record.publicPath),
        optimizedPublicPath: getOptimizedPublicPathWithRoot(record.publicPath, outputRoot),
      };
    }),
  );

  return enrichedRecords.sort((a, b) => b.sizeBytes - a.sizeBytes || a.publicPath.localeCompare(b.publicPath));
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function summarize(records, options) {
  const missing = records.filter((record) => !record.exists);
  const overBudget = records.filter((record) => record.overBudget);

  return {
    budget: `${options.maxSizeMb} MB`,
    referencedImages: records.length,
    missingImages: missing.length,
    overBudgetImages: overBudget.length,
    overBudgetBytes: overBudget.reduce((total, record) => total + record.sizeBytes, 0),
  };
}

function toJsonRecord(record) {
  return {
    path: record.publicPath,
    sizeBytes: record.sizeBytes,
    size: formatBytes(record.sizeBytes),
    exists: record.exists,
    overBudget: record.overBudget,
    optimizable: record.optimizable,
    optimizedPath: record.optimizedPublicPath,
    uses: record.uses,
  };
}

function printAudit(records, options) {
  const summary = summarize(records, options);
  const overBudget = records.filter((record) => record.overBudget);

  if (options.json) {
    console.log(JSON.stringify({ summary, images: records.map(toJsonRecord) }, null, 2));
    return;
  }

  console.log(
    `[image-assets] ${summary.referencedImages} referenced local images; ${summary.overBudgetImages} over ${summary.budget}.`,
  );

  if (summary.missingImages > 0) {
    console.log(`[image-assets] ${summary.missingImages} referenced image(s) are missing.`);
  }

  if (overBudget.length === 0) {
    console.log("[image-assets] Image budget OK.");
    return;
  }

  console.log("");
  for (const record of overBudget) {
    const useCount = record.uses.length === 1 ? "1 use" : `${record.uses.length} uses`;
    const status = record.optimizable ? "optimizable" : "not optimizable";
    console.log(`${formatBytes(record.sizeBytes).padStart(9)}  ${useCount.padStart(6)}  ${status}  ${record.publicPath}`);
  }
}

async function optimizeRecord(record, options) {
  const outputPublicPath = getOptimizedPublicPathWithRoot(record.publicPath, options.outputRoot);
  const outputPath = path.join(PUBLIC_DIR, outputPublicPath.slice(1));
  const input = sharp(record.absolutePath, { failOn: "none" }).rotate();
  const metadata = await input.metadata();
  const needsResize = metadata.width && metadata.width > options.maxWidth;

  if (!options.write) {
    return {
      ...record,
      outputPublicPath,
      outputPath,
      written: false,
      beforeBytes: record.sizeBytes,
      afterBytes: 0,
      resized: Boolean(needsResize),
    };
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  let pipeline = sharp(record.absolutePath, { failOn: "none" }).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({ width: options.maxWidth, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: options.quality, effort: 4 }).toFile(outputPath);
  const outputStat = await fs.stat(outputPath);

  return {
    ...record,
    outputPublicPath,
    outputPath,
    written: true,
    beforeBytes: record.sizeBytes,
    afterBytes: outputStat.size,
    resized: Boolean(needsResize),
  };
}

function getOptimizedPublicPathWithRoot(publicPath, outputRoot) {
  const extension = path.extname(publicPath);
  const withoutExtension = publicPath.slice(0, -extension.length);
  return `${outputRoot}${withoutExtension}.webp`;
}

async function replaceContentReferences(results) {
  const replacements = new Map(
    results
      .filter((result) => result.written)
      .map((result) => [result.publicPath, result.outputPublicPath]),
  );
  const files = new Set(results.flatMap((result) => result.uses.map((use) => path.join(ROOT_DIR, use.file))));
  let changedFiles = 0;
  let replacementCount = 0;

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    let next = raw;

    for (const [from, to] of replacements) {
      const occurrences = next.split(from).length - 1;
      if (occurrences > 0) {
        replacementCount += occurrences;
        next = next.split(from).join(to);
      }
    }

    if (next !== raw) {
      await fs.writeFile(filePath, next);
      changedFiles += 1;
    }
  }

  return { changedFiles, replacementCount };
}

async function optimize(records, options) {
  const candidates = records
    .filter((record) => record.overBudget && record.optimizable && record.exists)
    .slice(0, options.limit > 0 ? options.limit : undefined);

  if (options.json) {
    console.log(JSON.stringify({ candidates: candidates.map(toJsonRecord) }, null, 2));
    return [];
  }

  if (candidates.length === 0) {
    console.log("[image-assets] No optimizable over-budget referenced images found.");
    return [];
  }

  console.log(
    `[image-assets] ${options.write ? "Optimizing" : "Dry run:"} ${candidates.length} referenced image(s) over ${options.maxSizeMb} MB.`,
  );

  const results = [];
  for (const record of candidates) {
    const result = await optimizeRecord(record, options);
    results.push(result);

    if (options.write) {
      const savedBytes = result.beforeBytes - result.afterBytes;
      console.log(
        `${formatBytes(result.beforeBytes).padStart(9)} -> ${formatBytes(result.afterBytes).padStart(9)}  ` +
          `${formatBytes(savedBytes)} saved  ${result.outputPublicPath}`,
      );
    } else {
      console.log(`${formatBytes(result.beforeBytes).padStart(9)}  would write ${result.outputPublicPath}`);
    }
  }

  if (options.replaceReferences && results.length > 0) {
    const replacementResult = await replaceContentReferences(results);
    console.log(
      `[image-assets] Replaced ${replacementResult.replacementCount} reference(s) in ${replacementResult.changedFiles} content file(s).`,
    );
  }

  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const records = await scanReferencedImages(options.maxSizeBytes, options.outputRoot);

  if (options.command === "optimize") {
    await optimize(records, options);
    return;
  }

  printAudit(records, options);

  if (options.failOnOverBudget && records.some((record) => record.overBudget)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[image-assets] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
