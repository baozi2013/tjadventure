import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DRAFTS_DIR = path.join(ROOT_DIR, "content/cycling/_drafts");
const RIDE_TYPES = new Set(["road", "event", "gravel"]);

function usage() {
  return `Usage:
  npm run import:strava-cycling -- <strava-activity-url> [options]

Options:
  --slug <slug>             Override the generated draft slug.
  --ride-type <type>        road, event, or gravel (default: road).
  --location <name>         Location name to seed in frontmatter.
  --region <region>         Location region to seed in frontmatter.
  --cover-image <path>      Confirmed local or remote cover image.
  --embed-token <token>     Optional token copied from a Strava embed snippet.
  --stdout                  Print the generated MDX instead of writing a draft.
  --force                   Overwrite an existing draft with the same slug.
  --help                    Show this help.

Drafts are written under content/cycling/_drafts/ and are not published until
reviewed and moved into content/cycling/.`;
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
    url: "",
    slug: "",
    rideType: "road",
    location: "TODO: location",
    region: "TODO: region",
    coverImage: "",
    embedToken: "",
    stdout: false,
    force: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }

    if (argument === "--stdout") {
      options.stdout = true;
      continue;
    }

    if (argument === "--force") {
      options.force = true;
      continue;
    }

    const optionReaders = {
      "--url": "url",
      "--slug": "slug",
      "--ride-type": "rideType",
      "--location": "location",
      "--region": "region",
      "--cover-image": "coverImage",
      "--embed-token": "embedToken",
    };
    const optionKey = optionReaders[argument];
    if (optionKey) {
      options[optionKey] = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }

    if (!argument.startsWith("--") && !options.url) {
      options.url = argument;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.url) {
    throw new Error("A Strava activity URL is required.");
  }

  if (!RIDE_TYPES.has(options.rideType)) {
    throw new Error(`--ride-type must be one of: ${Array.from(RIDE_TYPES).join(", ")}.`);
  }

  if (options.embedToken && !/^[\w-]+$/.test(options.embedToken)) {
    throw new Error("--embed-token contains unsupported characters.");
  }

  return options;
}

function getActivityReference(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("The Strava activity URL is not valid.");
  }

  const isStravaHost = url.hostname === "strava.com" || url.hostname.endsWith(".strava.com");
  const activityMatch = url.pathname.match(/^\/activities\/(\d+)(?:\/|$)/);
  if (!isStravaHost || !activityMatch) {
    throw new Error("Use a URL in the form https://www.strava.com/activities/<id>.");
  }

  const activityId = activityMatch[1];
  return {
    activityId,
    canonicalUrl: `https://www.strava.com/activities/${activityId}`,
  };
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function textContent(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, "").trim());
}

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/\b([:\w-]+)=(["'])(.*?)\2/g)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[3]);
  }
  return attributes;
}

function parseMetaTags(html) {
  const metadata = new Map();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const key = attributes.property ?? attributes.name;
    if (key && attributes.content) {
      metadata.set(key.toLowerCase(), attributes.content);
    }
  }
  return metadata;
}

function parsePublicPage(html) {
  const metadata = parseMetaTags(html);
  const title = (metadata.get("og:title") ?? metadata.get("title") ?? "")
    .replace(/\s+\|\s+Strava\s*$/i, "")
    .trim();
  const description = metadata.get("og:description") ?? metadata.get("description") ?? "";
  const dateMatch = description.match(/\bon\s+([A-Z][a-z]+ \d{1,2}, \d{4})\b/);
  let rideDate = "";

  if (dateMatch) {
    const parsedDate = new Date(`${dateMatch[1]} UTC`);
    if (!Number.isNaN(parsedDate.getTime())) {
      rideDate = parsedDate.toISOString().slice(0, 10);
    }
  }

  return {
    title,
    rideDate,
    imageHint: metadata.get("og:image") ?? "",
  };
}

function readElementText(html, tagName, className) {
  const pattern = new RegExp(
    `<${tagName}\\b[^>]*class=(['\"])[^'\"]*\\b${className}\\b[^'\"]*\\1[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "i",
  );
  const match = html.match(pattern);
  return match ? textContent(match[2]) : "";
}

function parseMeasurement(rawValue, validUnits) {
  const match = rawValue.match(/^([\d,.]+)\s*(mi|km|ft|m)$/i);
  if (!match || !validUnits.has(match[2].toLowerCase())) return null;

  const value = Number.parseFloat(match[1].replaceAll(",", ""));
  if (!Number.isFinite(value) || value <= 0) return null;

  return {
    value,
    unit: match[2].toLowerCase(),
    display: rawValue,
  };
}

function parseMovingTime(rawValue) {
  if (!rawValue) return "";

  const clockMatch = rawValue.match(/^(\d{1,3}):([0-5]\d):([0-5]\d)$/);
  if (clockMatch) return rawValue;

  const hoursMatch = rawValue.match(/(\d+)\s*h/i);
  const minutesMatch = rawValue.match(/(\d+)\s*m/i);
  const secondsMatch = rawValue.match(/(\d+)\s*s/i);
  if (!hoursMatch && !minutesMatch && !secondsMatch) return "";

  const hours = Number.parseInt(hoursMatch?.[1] ?? "0", 10);
  const minutes = Number.parseInt(minutesMatch?.[1] ?? "0", 10);
  const seconds = Number.parseInt(secondsMatch?.[1] ?? "0", 10);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseEmbedPage(html) {
  const stats = new Map();
  const statPattern =
    /<div class=(["'])stat\1>\s*<div class=(["'])stat-label\2>([\s\S]*?)<\/div>\s*<div class=(["'])stat-value\4>([\s\S]*?)<\/div>\s*<\/div>/gi;
  for (const match of html.matchAll(statPattern)) {
    stats.set(textContent(match[3]).toLowerCase(), textContent(match[5]));
  }

  return {
    title: readElementText(html, "h1", "activity-name"),
    rideDate: readElementText(html, "div", "activity-date"),
    distance: parseMeasurement(stats.get("distance") ?? "", new Set(["mi", "km"])),
    elevationGain: parseMeasurement(stats.get("elev gain") ?? "", new Set(["ft", "m"])),
    movingTime: parseMovingTime(stats.get("time") ?? stats.get("moving time") ?? ""),
  };
}

function parseEmbedDate(rawDate) {
  if (!rawDate) return "";
  const parsedDate = new Date(`${rawDate} UTC`);
  return Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString().slice(0, 10);
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TJAdventure/1.0 cycling draft import",
    },
  });
  if (!response.ok) {
    throw new Error(`request returned HTTP ${response.status}`);
  }
  return response.text();
}

async function collectMetadata(activityId, canonicalUrl, embedToken) {
  const warnings = [];
  let publicMetadata = { title: "", rideDate: "", imageHint: "" };
  let embedMetadata = { title: "", rideDate: "", distance: null, elevationGain: null, movingTime: "" };

  try {
    publicMetadata = parsePublicPage(await fetchPage(canonicalUrl));
  } catch (error) {
    warnings.push(`Activity page metadata unavailable (${error.message}).`);
  }

  const embedUrl = new URL(`https://strava-embeds.com/activity/${activityId}`);
  embedUrl.searchParams.set("style", "standard");
  embedUrl.searchParams.set("fromEmbed", "false");
  if (embedToken) embedUrl.searchParams.set("token", embedToken);

  try {
    embedMetadata = parseEmbedPage(await fetchPage(embedUrl.toString()));
  } catch (error) {
    warnings.push(`Embed metadata unavailable (${error.message}).`);
  }

  return {
    title: publicMetadata.title || embedMetadata.title,
    rideDate: publicMetadata.rideDate || parseEmbedDate(embedMetadata.rideDate),
    imageHint: publicMetadata.imageHint,
    distance: embedMetadata.distance,
    elevationGain: embedMetadata.elevationGain,
    movingTime: embedMetadata.movingTime,
    warnings,
  };
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function yamlString(value) {
  return JSON.stringify(value);
}

function measureYaml(measurement, defaultUnit) {
  if (!measurement) {
    return `  value: "TODO"\n  unit: ${yamlString(defaultUnit)}\n  display: "TODO"`;
  }

  return `  value: ${measurement.value}\n  unit: ${yamlString(measurement.unit)}\n  display: ${yamlString(measurement.display)}`;
}

function escapeMdxAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function buildDraft(reference, metadata, options, slug) {
  const title = metadata.title || `Strava ride ${reference.activityId}`;
  const rideDate = metadata.rideDate || "TODO: YYYY-MM-DD";
  const movingTime = metadata.movingTime || "TODO: H:MM:SS";
  const coverImage = options.coverImage || "/trips/TODO/cover.jpg";
  const routeSurface = options.rideType === "gravel" ? "gravel" : "road";
  const mediaHint = metadata.imageHint || "No public image hint found; add a confirmed local cover photo.";
  const tokenLine = options.embedToken
    ? `\n  token="${escapeMdxAttribute(options.embedToken)}"`
    : "";

  return `---
title: ${yamlString(title)}
excerpt: ${yamlString(`TODO: summarize ${title} for the Cycling collection.`)}
rideDate: ${yamlString(rideDate)}
rideType: ${yamlString(options.rideType)}
distance:
${measureYaml(metadata.distance, "mi")}
elevationGain:
${measureYaml(metadata.elevationGain, "ft")}
movingTime: ${yamlString(movingTime)}
location:
  name: ${yamlString(options.location)}
  region: ${yamlString(options.region)}
route:
  name: ${yamlString(title)}
  start: "TODO"
  finish: "TODO"
  surface:
    - ${routeSurface}
stravaUrl: ${yamlString(reference.canonicalUrl)}
coverImage: ${yamlString(coverImage)}
logistics:
  - "TODO: parking, food, water, weather, and gear."
notes:
  - "TODO: pacing, route cautions, and what to repeat next time."
tags:
  - cycling
---

<!--
Imported as a draft from public Strava data.
Suggested slug: ${slug}
Media hint from public metadata: ${mediaHint}

Before publishing:
- Confirm title, ride type, date, route, location, and all stats.
- Replace TODO content and select a confirmed cover image/local gallery assets.
- For private or incomplete activities, fill the frontmatter manually from Strava
  and keep the canonical source URL for attribution.
-->

## Ride Summary

TODO: Write the story of this ride and why it matters.

<StravaActivity
  id="${reference.activityId}"${tokenLine}
  embedStyle="standard"
/>

## Route

TODO: Describe start, finish, surface, climbs, traffic, and refill points.

## Logistics

- Parking:
- Food and water:
- Weather:
- Gear:

## Notes

TODO: Record practical lessons and the best moments.
`;
}

async function writeDraft(slug, content, overwrite) {
  await fs.mkdir(DRAFTS_DIR, { recursive: true });
  const outputPath = path.join(DRAFTS_DIR, `${slug}.mdx`);

  if (!overwrite) {
    try {
      await fs.access(outputPath);
      throw new Error(`Draft already exists: ${path.relative(ROOT_DIR, outputPath)}. Use --force to overwrite it.`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  await fs.writeFile(outputPath, content, "utf8");
  return outputPath;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const reference = getActivityReference(options.url);
  const metadata = await collectMetadata(reference.activityId, reference.canonicalUrl, options.embedToken);
  const suggestedSlug = options.slug || slugify(metadata.title) || `strava-${reference.activityId}`;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suggestedSlug)) {
    throw new Error("The draft slug must contain only lowercase letters, numbers, and hyphens.");
  }

  const draft = buildDraft(reference, metadata, options, suggestedSlug);
  for (const warning of metadata.warnings) {
    console.error(`[import-strava-cycling] ${warning}`);
  }

  if (options.stdout) {
    process.stdout.write(draft);
    return;
  }

  const outputPath = await writeDraft(suggestedSlug, draft, options.force);
  const statsStatus = metadata.distance && metadata.elevationGain && metadata.movingTime
    ? "public stats captured"
    : "stats need manual completion";
  console.log(`[import-strava-cycling] Draft created (${statsStatus}): ${path.relative(ROOT_DIR, outputPath)}`);
}

main().catch((error) => {
  console.error(`[import-strava-cycling] ${error.message}`);
  console.error(usage());
  process.exitCode = 1;
});
