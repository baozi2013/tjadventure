import { getCyclingSearchIndex } from "@/lib/cycling";
import { DEFAULT_CONTENT_LOCALE } from "@/lib/content-locale";
import { getLearningSearchIndex } from "@/lib/learning";
import { getSearchIndex } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";
import type { SearchIndexEntry } from "@/types/search";

export function getAllSearchEntries(locale: Locale = DEFAULT_CONTENT_LOCALE): SearchIndexEntry[] {
  return [
    ...getSearchIndex(locale),
    ...getCyclingSearchIndex(locale),
    ...getLearningSearchIndex(locale),
  ];
}

export type TagCount = {
  tag: string;
  count: number;
};

export function getAllTags(locale: Locale = DEFAULT_CONTENT_LOCALE): TagCount[] {
  const counts = new Map<string, number>();

  for (const entry of getAllSearchEntries(locale)) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getEntriesByTag(tag: string, locale: Locale = DEFAULT_CONTENT_LOCALE): SearchIndexEntry[] {
  return getAllSearchEntries(locale)
    .filter((entry) => entry.tags.includes(tag))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
