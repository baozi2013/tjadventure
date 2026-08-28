import { getAllCyclingEntries } from "@/lib/cycling";
import { DEFAULT_CONTENT_LOCALE } from "@/lib/content-locale";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";
import type { WorldMapPin } from "@/types/maps";

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
    if (entry.location.lat == null || entry.location.lng == null) return [];

    return [
      {
        id: `cycling-${entry.slug}`,
        kind: "cycling" as const,
        lat: entry.location.lat,
        lng: entry.location.lng,
        title: entry.title,
        subtitle: `${entry.location.name} · ${entry.location.region}`,
        href: `/cycling/${entry.slug}`,
        image: entry.coverImage,
      },
    ];
  });

  return [...postPins, ...cyclingPins];
}
