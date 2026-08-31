import fs from "node:fs";
import path from "node:path";
import { getAllCyclingEntries } from "@/lib/cycling";
import { DEFAULT_CONTENT_LOCALE } from "@/lib/content-locale";
import { readGeoJsonTrack } from "@/lib/geojson-track";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";
import type { WorldMapPin } from "@/types/maps";

type LatLng = { lat: number; lng: number };

function getTrackStartCoordinate(trackSrc: string): LatLng | null {
  try {
    const filePath = path.join(process.cwd(), "public", trackSrc.replace(/^\//, ""));
    const geoJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const firstPoint = readGeoJsonTrack(geoJson)[0]?.[0];
    return firstPoint ? { lat: firstPoint.lat, lng: firstPoint.lng } : null;
  } catch {
    return null;
  }
}

export function getWorldMapPins(locale: Locale = DEFAULT_CONTENT_LOCALE): WorldMapPin[] {
  const postPins: WorldMapPin[] = getAllPosts(locale).flatMap((post) => {
    const entry = getPostBySlug(post.slug, locale);
    const location = entry?.locations[0];
    if (!location) return [];

    return [
      {
        id: `post-${post.slug}`,
        kind: "post" as const,
        lat: location.lat,
        lng: location.lng,
        title: post.title,
        subtitle: post.category,
        href: `/posts/${post.slug}`,
        image: location.image ?? post.coverImage,
      },
    ];
  });

  const cyclingPins: WorldMapPin[] = getAllCyclingEntries(locale).flatMap((entry) => {
    const explicitLocation: LatLng | null =
      entry.location.lat != null && entry.location.lng != null
        ? { lat: entry.location.lat, lng: entry.location.lng }
        : null;
    // Some rides only ever recorded a real GPS track and never had a start
    // coordinate hand-entered into frontmatter; fall back to the track's
    // first point rather than silently dropping them from the map.
    const location = explicitLocation ?? (entry.route?.track ? getTrackStartCoordinate(entry.route.track.src) : null);
    if (!location) return [];

    return [
      {
        id: `cycling-${entry.slug}`,
        kind: "cycling" as const,
        lat: location.lat,
        lng: location.lng,
        title: entry.title,
        subtitle: `${entry.location.name} · ${entry.location.region}`,
        href: `/cycling/${entry.slug}`,
        image: entry.coverImage,
      },
    ];
  });

  return [...postPins, ...cyclingPins];
}
