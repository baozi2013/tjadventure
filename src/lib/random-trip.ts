import { getAllCyclingEntries } from "@/lib/cycling";
import { DEFAULT_CONTENT_LOCALE } from "@/lib/content-locale";
import { getAllPosts } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";

export function getRandomTripHrefs(locale: Locale = DEFAULT_CONTENT_LOCALE): string[] {
  const postHrefs = getAllPosts(locale).map((post) => `/posts/${post.slug}`);
  const cyclingHrefs = getAllCyclingEntries(locale).map((entry) => `/cycling/${entry.slug}`);
  return [...postHrefs, ...cyclingHrefs];
}
