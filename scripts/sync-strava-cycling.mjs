import fs from "node:fs/promises";
import path from "node:path";
import { stravaApi, loadEnvFile } from "./lib/strava-client.mjs";

const ROOT_DIR = process.cwd();
const CYCLING_DIR = path.join(ROOT_DIR, "content", "cycling");
const DRAFTS_DIR = path.join(CYCLING_DIR, "_drafts");
const RIDE_TYPES = new Set(["road", "gravel", "event"]);

function usage() {
  return `Usage:
  npm run sync:strava-cycling -- [options]

Options:
  --activity-id <id>        Sync one authorized activity by Strava activity id.
  --activity-json <path>    Generate from a saved Strava activity JSON file, for review/testing.
  --after <YYYY-MM-DD>      Fetch athlete activities after this date.
  --limit <number>          Maximum activities to consider (default: 10, max: 200).
  --ride-type <type>        Force road, gravel, or event; otherwise infer from sport_type.
  --location <name>         Override draft location name.
  --region <region>         Override draft location region.
  --cover-image <path>      Confirmed local or remote cover image.
  --force                   Overwrite existing drafts. Published entries are never overwritten.
  --dry-run                 Print planned draft writes without changing files.
  --help                    Show this help.

This command writes reviewable drafts to content/cycling/_drafts/. Nothing is
published until a human reviews and moves a draft into content/cycling/.`;
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
    activityId: "",
    activityJson: "",
    after: "",
    limit: 10,
    rideType: "",
    location: "",
    region: "",
    coverImage: "",
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--force" || argument === "--update") {
      options.force = true;
      continue;
    }
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    const optionReaders = {
      "--activity-id": "activityId",
      "--activity-json": "activityJson",
      "--after": "after",
      "--limit": "limit",
      "--ride-type": "rideType",
      "--location": "location",
      "--region": "region",
      "--cover-image": "coverImage",
    };
    const optionKey = optionReaders[argument];
    if (optionKey) {
      options[optionKey] = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (options.rideType && !RIDE_TYPES.has(options.rideType)) {
    throw new Error(`--ride-type must be one of: ${Array.from(RIDE_TYPES).join(", ")}.`);
  }

  options.limit = Number.parseInt(String(options.limit), 10);
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 200) {
    throw new Error("--limit must be an integer between 1 and 200.");
  }

  if (options.after && !/^\d{4}-\d{2}-\d{2}$/.test(options.after)) {
    throw new Error("--after must use YYYY-MM-DD format.");
  }

  return options;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function yamlString(value) {
  return JSON.stringify(value);
}

function secondsToClock(seconds) {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function metersToMiles(meters) {
  return Math.round((meters / 1609.344) * 10) / 10;
}

function metersToFeet(meters) {
  return Math.round(meters * 3.28084);
}

function inferRideType(activity, forcedRideType) {
  if (forcedRideType) return forcedRideType;

  const sportType = String(activity.sport_type ?? activity.type ?? "").toLowerCase();
  if (sportType.includes("race")) return "event";
  if (sportType.includes("gravel") || sportType.includes("mountainbike")) return "gravel";
  return "road";
}

function inferSurface(rideType) {
  return rideType === "gravel" ? "mixed" : "road";
}

function inferLocation(activity, options) {
  const city = activity.location_city;
  const state = activity.location_state;
  const country = activity.location_country;

  return {
    name: options.location || city || state || country || "TODO: location",
    region: options.region || [country === "United States" ? "US" : country, state].filter(Boolean).join(" - ") || "TODO: region",
  };
}

function isRideActivity(activity) {
  const sportType = String(activity.sport_type ?? activity.type ?? "").toLowerCase();
  return sportType.includes("ride") || sportType.includes("bike") || sportType.includes("cycling");
}

function buildDraft(activity, options) {
  const activityId = String(activity.id);
  const rideDate = String(activity.start_date_local ?? activity.start_date ?? "").slice(0, 10) || "TODO: YYYY-MM-DD";
  const title = activity.name || `Strava activity ${activityId}`;
  const year = /^\d{4}/.test(rideDate) ? rideDate.slice(0, 4) : "draft";
  const slug = slugify(`${title}-${year}`) || `strava-${activityId}`;
  const rideType = inferRideType(activity, options.rideType);
  const distance = metersToMiles(Number(activity.distance ?? 0));
  const elevationGain = metersToFeet(Number(activity.total_elevation_gain ?? 0));
  const movingTime = secondsToClock(Number(activity.moving_time ?? 0));
  const location = inferLocation(activity, options);
  const coverImage = options.coverImage || "/trips/TODO/cover.jpg";
  const routeName = activity.route?.name || title;

  const draft = `---
title: ${yamlString(title)}
excerpt: ${yamlString(`TODO: summarize ${title} for the Cycling collection.`)}
rideDate: ${yamlString(rideDate)}
rideType: ${yamlString(rideType)}
distance:
  value: ${distance || '"TODO"'}
  unit: "mi"
  display: ${yamlString(distance ? `${distance.toFixed(1)} mi` : "TODO")}
elevationGain:
  value: ${elevationGain || '"TODO"'}
  unit: "ft"
  display: ${yamlString(elevationGain ? `${elevationGain.toLocaleString("en-US")} ft` : "TODO")}
movingTime: ${yamlString(movingTime)}
location:
  name: ${yamlString(location.name)}
  region: ${yamlString(location.region)}
route:
  name: ${yamlString(routeName)}
  surface:
    - ${inferSurface(rideType)}
stravaUrl: ${yamlString(`https://www.strava.com/activities/${activityId}`)}
coverImage: ${yamlString(coverImage)}
logistics:
  - "TODO: confirm parking, food, water, weather, and gear."
notes:
  - "Synced from authorized Strava activity ${activityId}; review before publishing."
tags:
  - cycling
  - strava-sync
  - ${rideType}
---

<!--
Synced from Strava OAuth metadata.
Manual review checkpoint:
- Confirm title, route, location, ride type, stats, and privacy.
- Replace TODO cover image with a confirmed local or remote asset.
- Move this file from content/cycling/_drafts/ to content/cycling/ only after review.

Source sport_type: ${activity.sport_type ?? activity.type ?? "unknown"}
Source start_date_local: ${activity.start_date_local ?? "unknown"}
-->

## Ride Summary

TODO: Write the story of this ride and why it matters.

<StravaActivity
  id="${activityId}"
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

  return {
    slug,
    draft,
    activityId,
  };
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function fetchActivities(options) {
  if (options.activityJson) {
    const raw = await fs.readFile(options.activityJson, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  if (options.activityId) {
    return [await stravaApi(`/api/v3/activities/${options.activityId}`)];
  }

  const searchParams = {
    per_page: options.limit,
    page: 1,
  };
  if (options.after) {
    searchParams.after = Math.floor(new Date(`${options.after}T00:00:00Z`).getTime() / 1000);
  }

  return stravaApi("/api/v3/athlete/activities", { searchParams });
}

async function writeDraft({ slug, draft, activityId }, options) {
  const publishedPath = path.join(CYCLING_DIR, `${slug}.mdx`);
  if (await pathExists(publishedPath)) {
    return {
      action: "skipped-published",
      path: publishedPath,
      activityId,
    };
  }

  const outputPath = path.join(DRAFTS_DIR, `${slug}.mdx`);
  const exists = await pathExists(outputPath);
  if (exists && !options.force) {
    return {
      action: "skipped-existing-draft",
      path: outputPath,
      activityId,
    };
  }

  if (!options.dryRun) {
    await fs.mkdir(DRAFTS_DIR, { recursive: true });
    await fs.writeFile(outputPath, draft, "utf8");
  }

  return {
    action: options.dryRun
      ? exists
        ? "would-update-draft"
        : "would-create-draft"
      : exists
        ? "updated-draft"
        : "created-draft",
    path: outputPath,
    activityId,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  await loadEnvFile();
  const activities = (await fetchActivities(options)).filter(isRideActivity).slice(0, options.limit);

  if (activities.length === 0) {
    console.log("[sync-strava-cycling] No ride activities matched.");
    return;
  }

  const results = [];
  for (const activity of activities) {
    results.push(await writeDraft(buildDraft(activity, options), options));
  }

  for (const result of results) {
    console.log(
      `[sync-strava-cycling] ${result.action}: ${path.relative(ROOT_DIR, result.path)} (activity ${result.activityId})`,
    );
  }
}

main().catch((error) => {
  console.error(`[sync-strava-cycling] ${error.message}`);
  console.error(usage());
  process.exitCode = 1;
});
