import { getAllCyclingEntries } from "@/lib/cycling";
import { DEFAULT_CONTENT_LOCALE } from "@/lib/content-locale";
import { getAllLearningEntries } from "@/lib/learning";
import { getAllPosts } from "@/lib/posts";
import { toFeet, toMiles } from "@/lib/units";
import type { Locale } from "@/i18n/routing";

export type SiteStats = {
  totalPosts: number;
  regions: string[];
  totalCyclingRides: number;
  totalDistanceMiles: number;
  totalElevationFeet: number;
  totalLearningEntries: number;
  firstYear: number | null;
};

export function computeSiteStats(locale: Locale = DEFAULT_CONTENT_LOCALE): SiteStats {
  const posts = getAllPosts(locale);
  const cyclingEntries = getAllCyclingEntries(locale);
  const learningEntries = getAllLearningEntries(locale);

  const regions = Array.from(new Set(posts.map((post) => post.category.split(" · ")[0]))).sort();

  const totalDistanceMiles = cyclingEntries.reduce(
    (sum, entry) => sum + toMiles(entry.distance.value, entry.distance.unit),
    0,
  );
  const totalElevationFeet = cyclingEntries.reduce(
    (sum, entry) => sum + toFeet(entry.elevationGain.value, entry.elevationGain.unit),
    0,
  );

  const allYears = [
    ...posts.map((post) => new Date(post.date).getFullYear()),
    ...cyclingEntries.map((entry) => new Date(entry.rideDate).getFullYear()),
  ].filter((year) => Number.isFinite(year));

  return {
    totalPosts: posts.length,
    regions,
    totalCyclingRides: cyclingEntries.length,
    totalDistanceMiles,
    totalElevationFeet,
    totalLearningEntries: learningEntries.length,
    firstYear: allYears.length > 0 ? Math.min(...allYears) : null,
  };
}
