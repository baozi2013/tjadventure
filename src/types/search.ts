import type { Locale } from "@/i18n/routing";

export type SearchIndexEntry = {
  slug: string;
  locale: Locale;
  translationKey: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  region: string;
  date: string;
  readTime: string;
  coverImage: string;
  tags: string[];
  headings: string[];
  locations: string[];
  body: string;
  searchText: string;
};
