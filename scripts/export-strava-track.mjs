import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvFile, stravaApi } from "./lib/strava-client.mjs";

const ROOT_DIR = process.cwd();
const TRACKS_DIR = path.join(ROOT_DIR, "public", "tracks");

function usage() {
  return `Usage:
  npm run export:strava-track -- --activity-id <id> --slug <slug> [options]

Options:
  --activity-id <id>        Authorized Strava activity id to export.
  --slug <slug>             Output filename stem under public/tracks/.
  --title <title>           Track title stored in GeoJSON properties.
  --out <path>              Override output path (default: public/tracks/<slug>.geojson).
  --precision <digits>      Coordinate decimal precision (default: 6).
  --force                   Overwrite an existing output file.
  --dry-run                 Fetch and report point count without writing.
  --help                    Show this help.

The command uses the existing Strava OAuth env/token files and exports the
authenticated activity lat/lng stream as a GeoJSON LineString.`;
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
    slug: "",
    title: "",
    out: "",
    precision: 6,
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }

    if (argument === "--force") {
      options.force = true;
      continue;
    }

    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    const optionReaders = {
      "--activity-id": "activityId",
      "--slug": "slug",
      "--title": "title",
      "--out": "out",
      "--precision": "precision",
    };
    const optionKey = optionReaders[argument];
    if (optionKey) {
      options[optionKey] = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!/^\d+$/.test(options.activityId)) {
    throw new Error("--activity-id must be a numeric Strava activity id.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)) {
    throw new Error("--slug must contain only lowercase letters, numbers, and hyphens.");
  }

  options.precision = Number.parseInt(String(options.precision), 10);
  if (!Number.isInteger(options.precision) || options.precision < 0 || options.precision > 8) {
    throw new Error("--precision must be an integer between 0 and 8.");
  }

  return {
    ...options,
    out: options.out || path.join(TRACKS_DIR, `${options.slug}.geojson`),
  };
}

function readStreamData(payload, streamType) {
  if (Array.isArray(payload)) {
    return payload.find((stream) => stream?.type === streamType)?.data;
  }

  if (payload && typeof payload === "object") {
    return payload[streamType]?.data;
  }

  return undefined;
}

function roundCoordinate(value, precision) {
  return Number(value.toFixed(precision));
}

function readCoordinates(payload, precision) {
  const latLngStream = readStreamData(payload, "latlng");
  const altitudeStream = readStreamData(payload, "altitude");

  if (!Array.isArray(latLngStream)) {
    throw new Error("Strava stream response did not include latlng data.");
  }

  const coordinates = latLngStream.flatMap((point, index) => {
    if (!Array.isArray(point) || point.length < 2) return [];

    const [lat, lng] = point;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return [];
    }

    const coordinate = [roundCoordinate(lng, precision), roundCoordinate(lat, precision)];
    const altitude = Array.isArray(altitudeStream) ? altitudeStream[index] : undefined;
    if (typeof altitude === "number" && Number.isFinite(altitude)) {
      coordinate.push(roundCoordinate(altitude, 1));
    }

    return [coordinate];
  });

  if (coordinates.length < 2) {
    throw new Error(`Strava latlng stream only yielded ${coordinates.length} valid point(s).`);
  }

  return coordinates;
}

function buildGeoJson(options, coordinates) {
  const title = options.title || `Strava activity ${options.activityId} track`;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: title,
          source: "Strava API authenticated activity streams",
          activityId: options.activityId,
          stravaUrl: `https://www.strava.com/activities/${options.activityId}`,
          coordinateCount: coordinates.length,
        },
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    ],
  };
}

async function assertCanWrite(outputPath, force) {
  if (force) return;

  try {
    await fs.access(outputPath);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  throw new Error(`Output already exists: ${path.relative(ROOT_DIR, outputPath)}. Use --force to overwrite.`);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  await loadEnvFile();

  const streams = await stravaApi(`/api/v3/activities/${options.activityId}/streams`, {
    searchParams: {
      keys: "latlng,altitude",
      key_by_type: true,
    },
  });
  const coordinates = readCoordinates(streams, options.precision);
  const geoJson = buildGeoJson(options, coordinates);

  if (!options.dryRun) {
    await assertCanWrite(options.out, options.force);
    await fs.mkdir(path.dirname(options.out), { recursive: true });
    await fs.writeFile(options.out, `${JSON.stringify(geoJson, null, 2)}\n`, "utf8");
  }

  const relativePath = path.relative(ROOT_DIR, options.out);
  const action = options.dryRun ? "would export" : "exported";
  console.log(`[export-strava-track] ${action} ${coordinates.length} points: ${relativePath}`);
}

main().catch((error) => {
  console.error(`[export-strava-track] ${error.message}`);
  console.error(usage());
  process.exitCode = 1;
});
