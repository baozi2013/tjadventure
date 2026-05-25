import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, "content/posts");
const CYCLING_DIR = path.join(ROOT_DIR, "content/cycling");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_FORMAT = /^.+\s·\s.+$/;
const READ_TIME_FORMAT = /^[1-9]\d*\s+min$/;
const HTTP_FORMAT = /^https?:\/\//;
const MOVING_TIME_FORMAT = /^\d{1,3}:[0-5]\d:[0-5]\d$/;
const CYCLING_RIDE_TYPES = new Set(["road", "event", "gravel"]);
const CYCLING_DISTANCE_UNITS = new Set(["mi", "km"]);
const CYCLING_ELEVATION_UNITS = new Set(["ft", "m"]);
const CYCLING_ROUTE_SURFACES = new Set(["road", "gravel", "paved-trail", "mixed"]);
const CYCLING_IMAGE_ROLES = new Set(["cover", "route", "gallery"]);

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

function readOptionalText(record, key, fieldName, errors) {
  const value = record[key];
  if (value == null) return;

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`"${fieldName}" must be a non-empty string when provided.`);
  }
}

function validateRequiredTextFields(data, fields, errors) {
  for (const key of fields) {
    if (typeof data[key] !== "string" || data[key].trim().length === 0) {
      errors.push(`"${key}" must be a non-empty string.`);
    }
  }
}

function validatePositiveMeasurement(data, fieldName, validUnits, errors) {
  const value = data[fieldName];
  if (!isRecord(value)) {
    errors.push(`"${fieldName}" must be an object with "value" and "unit".`);
    return;
  }

  const rawValue = value.value;
  const parsed =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string"
        ? Number.parseFloat(rawValue)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    errors.push(`"${fieldName}.value" must be a positive number.`);
  }

  if (typeof value.unit !== "string" || !validUnits.has(value.unit)) {
    errors.push(`"${fieldName}.unit" must be one of: ${Array.from(validUnits).join(", ")}.`);
  }

  if (value.display != null && (typeof value.display !== "string" || value.display.trim().length === 0)) {
    errors.push(`"${fieldName}.display" must be a non-empty string when provided.`);
  }
}

function validateOptionalStringArray(value, fieldName, errors, options = {}) {
  if (value == null) return;

  if (!Array.isArray(value)) {
    errors.push(`"${fieldName}" must be an array of strings when provided.`);
    return;
  }

  if (value.length === 0) {
    errors.push(`"${fieldName}" cannot be an empty array when provided.`);
    return;
  }

  const normalized = [];
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      errors.push(`"${fieldName}[${index}]" must be a non-empty string.`);
      return;
    }

    normalized.push(item.trim());
  });

  if (options.unique && new Set(normalized).size !== normalized.length) {
    errors.push(`"${fieldName}" must not contain duplicates.`);
  }
}

function validateOptionalNumber(record, key, fieldName, min, max, errors) {
  const value = record[key];
  if (value == null) return;

  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    errors.push(`"${fieldName}" must be a valid number.`);
  } else if (parsed < min || parsed > max) {
    errors.push(`"${fieldName}" must be in range [${min}, ${max}].`);
  }
}

function validateCyclingImagePath(rawPath, fieldName, filePath, errors) {
  if (typeof rawPath !== "string" || rawPath.trim().length === 0) {
    errors.push(`"${fieldName}" must be a non-empty string.`);
    return;
  }

  const imagePath = rawPath.trim();
  if (imagePath.startsWith("/")) {
    validateLocalPublicAsset(imagePath, fieldName, filePath, errors);
  } else if (!HTTP_FORMAT.test(imagePath)) {
    errors.push(`"${fieldName}" must be a local "/..." path or http(s) URL.`);
  }
}

function validateStravaUrl(rawUrl, errors) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    errors.push('"stravaUrl" must be a non-empty string.');
    return;
  }

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    errors.push('"stravaUrl" must be a valid URL.');
    return;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    errors.push('"stravaUrl" must use http(s).');
  }

  if (url.hostname !== "strava.com" && !url.hostname.endsWith(".strava.com")) {
    errors.push('"stravaUrl" must point to strava.com.');
  }

  if (!url.pathname.startsWith("/activities/")) {
    errors.push('"stravaUrl" must point to a Strava activity URL.');
  }
}

function validateCyclingLocation(location, errors) {
  if (!isRecord(location)) {
    errors.push('"location" must be an object.');
    return;
  }

  if (typeof location.name !== "string" || location.name.trim().length === 0) {
    errors.push('"location.name" must be a non-empty string.');
  }

  if (typeof location.region !== "string" || location.region.trim().length === 0) {
    errors.push('"location.region" must be a non-empty string.');
  }

  validateOptionalNumber(location, "lat", "location.lat", -90, 90, errors);
  validateOptionalNumber(location, "lng", "location.lng", -180, 180, errors);
  readOptionalText(location, "note", "location.note", errors);
}

function validateCyclingRoute(route, errors) {
  if (route == null) return;

  if (!isRecord(route)) {
    errors.push('"route" must be an object when provided.');
    return;
  }

  readOptionalText(route, "name", "route.name", errors);
  readOptionalText(route, "start", "route.start", errors);
  readOptionalText(route, "finish", "route.finish", errors);

  if (route.surface != null) {
    if (!Array.isArray(route.surface) || route.surface.length === 0) {
      errors.push('"route.surface" must be a non-empty array when provided.');
    } else {
      route.surface.forEach((item, index) => {
        if (typeof item !== "string" || !CYCLING_ROUTE_SURFACES.has(item)) {
          errors.push(`"route.surface[${index}]" must be one of: ${Array.from(CYCLING_ROUTE_SURFACES).join(", ")}.`);
        }
      });
    }
  }

  if (!route.name && !route.start && !route.finish && !route.surface) {
    errors.push('"route" must include at least one field when provided.');
  }
}

function validateCyclingImages(images, filePath, errors) {
  if (images == null) return;

  if (!Array.isArray(images) || images.length === 0) {
    errors.push('"images" must be a non-empty array when provided.');
    return;
  }

  images.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`"images[${index}]" must be an object.`);
      return;
    }

    validateCyclingImagePath(item.src, `images[${index}].src`, filePath, errors);

    if (typeof item.alt !== "string" || item.alt.trim().length === 0) {
      errors.push(`"images[${index}].alt" must be a non-empty string.`);
    }

    readOptionalText(item, "caption", `images[${index}].caption`, errors);

    if (item.role != null && (typeof item.role !== "string" || !CYCLING_IMAGE_ROLES.has(item.role))) {
      errors.push(`"images[${index}].role" must be one of: ${Array.from(CYCLING_IMAGE_ROLES).join(", ")}.`);
    }
  });
}

function validateCyclingFrontmatter(data, filePath) {
  const errors = [];

  if (!isRecord(data)) {
    return ["frontmatter must be an object."];
  }

  validateRequiredTextFields(data, ["title", "excerpt", "rideDate", "rideType", "movingTime", "stravaUrl", "coverImage"], errors);

  if (errors.length > 0) {
    return errors;
  }

  const rideDate = data.rideDate.trim();
  const rideType = data.rideType.trim();
  const movingTime = data.movingTime.trim();

  if (!isValidDate(rideDate)) {
    errors.push('"rideDate" must be a valid calendar date in YYYY-MM-DD format.');
  }

  if (!CYCLING_RIDE_TYPES.has(rideType)) {
    errors.push(`"rideType" must be one of: ${Array.from(CYCLING_RIDE_TYPES).join(", ")}.`);
  }

  validatePositiveMeasurement(data, "distance", CYCLING_DISTANCE_UNITS, errors);
  validatePositiveMeasurement(data, "elevationGain", CYCLING_ELEVATION_UNITS, errors);

  if (!MOVING_TIME_FORMAT.test(movingTime)) {
    errors.push('"movingTime" must use HHH:MM:SS format, for example "5:12:30".');
  }

  validateCyclingLocation(data.location, errors);
  validateCyclingRoute(data.route, errors);
  validateStravaUrl(data.stravaUrl, errors);
  validateCyclingImagePath(data.coverImage, "coverImage", filePath, errors);
  validateCyclingImages(data.images, filePath, errors);
  validateOptionalStringArray(data.logistics, "logistics", errors);
  validateOptionalStringArray(data.notes, "notes", errors);
  validateOptionalStringArray(data.tags, "tags", errors, { unique: true });

  return errors;
}

function listContentFiles(directory) {
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

function validateFiles(files, validateFn) {
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

    const validationErrors = validateFn(data, relativePath);
    if (validationErrors.length > 0) {
      errorsByFile.push({
        file: relativePath,
        errors: validationErrors,
      });
    }
  }

  return errorsByFile;
}

function main() {
  const postFiles = listContentFiles(POSTS_DIR);
  const cyclingFiles = listContentFiles(CYCLING_DIR);

  if (postFiles.length === 0 && cyclingFiles.length === 0) {
    console.log("[validate-posts] No content files found. Skipping.");
    return;
  }

  const errorsByFile = [
    ...validateFiles(postFiles, validateFrontmatter),
    ...validateFiles(cyclingFiles, validateCyclingFrontmatter),
  ];

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

  console.log(`[validate-posts] OK (${postFiles.length} posts, ${cyclingFiles.length} cycling entries validated).`);
}

main();
