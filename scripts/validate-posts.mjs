import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, "content/posts");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_FORMAT = /^.+\s·\s.+$/;
const READ_TIME_FORMAT = /^[1-9]\d*\s+min$/;
const HTTP_FORMAT = /^https?:\/\//;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(rawDate) {
  if (!DATE_FORMAT.test(rawDate)) return false;
  const [year, month, day] = rawDate.split("-").map((value) => Number.parseInt(value, 10));
  const normalized = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(normalized.getTime()) &&
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() + 1 === month &&
    normalized.getUTCDate() === day
  );
}

function validateLocalPublicAsset(rawPath, fieldName, filePath, errors) {
  if (!rawPath.startsWith("/")) {
    errors.push(`"${fieldName}" must start with "/".`);
    return;
  }

  if (rawPath.includes("..")) {
    errors.push(`"${fieldName}" must not contain ".." segments.`);
    return;
  }

  const absolutePath = path.join(PUBLIC_DIR, rawPath.slice(1));
  if (!fs.existsSync(absolutePath)) {
    errors.push(`"${fieldName}" points to missing file: "${rawPath}".`);
  }
}

function validateFrontmatter(data, filePath) {
  const errors = [];

  if (!isRecord(data)) {
    return ["frontmatter must be an object."];
  }

  const requiredTextFields = ["title", "excerpt", "date", "category", "readTime", "coverImage"];
  for (const key of requiredTextFields) {
    if (typeof data[key] !== "string" || data[key].trim().length === 0) {
      errors.push(`"${key}" must be a non-empty string.`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  const date = data.date.trim();
  const category = data.category.trim();
  const readTime = data.readTime.trim();
  const coverImage = data.coverImage.trim();

  if (!isValidDate(date)) {
    errors.push(`"date" must be a valid calendar date in YYYY-MM-DD format.`);
  }

  if (!CATEGORY_FORMAT.test(category)) {
    errors.push(`"category" must follow "Region · Theme" format.`);
  }

  if (!READ_TIME_FORMAT.test(readTime)) {
    errors.push(`"readTime" must follow "<number> min" format (for example, "8 min").`);
  }

  if (coverImage.startsWith("/")) {
    validateLocalPublicAsset(coverImage, "coverImage", filePath, errors);
  } else if (!HTTP_FORMAT.test(coverImage)) {
    errors.push(`"coverImage" must be a local "/..." path or http(s) URL.`);
  }

  if (data.tags != null) {
    if (!Array.isArray(data.tags)) {
      errors.push(`"tags" must be an array of strings when provided.`);
    } else {
      const normalizedTags = [];
      for (const tag of data.tags) {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          errors.push(`"tags" entries must be non-empty strings.`);
          continue;
        }
        normalizedTags.push(tag.trim());
      }

      const uniqueTagCount = new Set(normalizedTags).size;
      if (uniqueTagCount !== normalizedTags.length) {
        errors.push(`"tags" must not contain duplicates.`);
      }
    }
  }

  if (data.locations != null) {
    if (!Array.isArray(data.locations)) {
      errors.push(`"locations" must be an array when provided.`);
    } else if (data.locations.length === 0) {
      errors.push(`"locations" cannot be an empty array.`);
    } else {
      data.locations.forEach((item, index) => {
        if (!isRecord(item)) {
          errors.push(`"locations[${index}]" must be an object.`);
          return;
        }

        if (typeof item.name !== "string" || item.name.trim().length === 0) {
          errors.push(`"locations[${index}].name" must be a non-empty string.`);
        }

        for (const [key, min, max] of [["lat", -90, 90], ["lng", -180, 180]]) {
          const rawValue = item[key];
          const parsed =
            typeof rawValue === "number"
              ? rawValue
              : typeof rawValue === "string"
                ? Number.parseFloat(rawValue)
                : Number.NaN;

          if (!Number.isFinite(parsed)) {
            errors.push(`"locations[${index}].${key}" must be a valid number.`);
          } else if (parsed < min || parsed > max) {
            errors.push(`"locations[${index}].${key}" must be in range [${min}, ${max}].`);
          }
        }

        if (item.note != null && (typeof item.note !== "string" || item.note.trim().length === 0)) {
          errors.push(`"locations[${index}].note" must be a non-empty string when provided.`);
        }

        if (item.image != null) {
          if (typeof item.image !== "string" || item.image.trim().length === 0) {
            errors.push(`"locations[${index}].image" must be a non-empty string when provided.`);
          } else {
            const locationImage = item.image.trim();
            if (locationImage.startsWith("/")) {
              validateLocalPublicAsset(locationImage, `locations[${index}].image`, filePath, errors);
            } else if (!HTTP_FORMAT.test(locationImage)) {
              errors.push(`"locations[${index}].image" must be a local "/..." path or http(s) URL.`);
            }
          }
        }
      });
    }
  }

  return errors;
}

function listPostFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith("_")) continue;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...listPostFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const files = listPostFiles(POSTS_DIR);
  if (files.length === 0) {
    console.log("[validate-posts] No post files found. Skipping.");
    return;
  }

  const errorsByFile = [];
  const seenSlugs = new Set();

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);
    const relativePath = path.relative(ROOT_DIR, filePath);

    const slug = path.basename(filePath, ".mdx");
    if (seenSlugs.has(slug)) {
      errorsByFile.push({
        file: relativePath,
        errors: [`Duplicate slug detected: "${slug}".`],
      });
      continue;
    }
    seenSlugs.add(slug);

    const validationErrors = validateFrontmatter(data, relativePath);
    if (validationErrors.length > 0) {
      errorsByFile.push({
        file: relativePath,
        errors: validationErrors,
      });
    }
  }

  if (errorsByFile.length > 0) {
    console.error(`[validate-posts] Found ${errorsByFile.length} file(s) with frontmatter errors:\n`);
    for (const item of errorsByFile) {
      console.error(`- ${item.file}`);
      for (const error of item.errors) {
        console.error(`  - ${error}`);
      }
    }
    process.exit(1);
  }

  console.log(`[validate-posts] OK (${files.length} posts validated).`);
}

main();
