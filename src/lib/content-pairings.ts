import { getCyclingEntryBySlug } from "@/lib/cycling";
import { getPostBySlug, type PostSummary } from "@/lib/posts";
import type { CyclingEntry, CyclingSummary } from "@/types/cycling";

function toCyclingSummary(entry: CyclingEntry): CyclingSummary {
  return {
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    rideDate: entry.rideDate,
    rideType: entry.rideType,
    distance: entry.distance,
    elevationGain: entry.elevationGain,
    movingTime: entry.movingTime,
    location: entry.location,
    route: entry.route,
    stravaUrl: entry.stravaUrl,
    logistics: entry.logistics,
    notes: entry.notes,
    coverImage: entry.coverImage,
    images: entry.images,
    tags: entry.tags,
  };
}

export function getPairedCyclingEntryForPostSlug(slug: string): CyclingSummary | null {
  const entry = getCyclingEntryBySlug(slug);
  return entry ? toCyclingSummary(entry) : null;
}

export function getPairedPostForCyclingSlug(slug: string): PostSummary | null {
  const post = getPostBySlug(slug);

  if (!post) return null;

  return {
    slug: post.slug,
    ...post.frontmatter,
  };
}
