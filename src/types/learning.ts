import type { Locale } from "@/i18n/routing";

export type LearningFrontmatter = {
  title: string;
  excerpt: string;
  locale: Locale;
  translationKey: string;
  canonicalLocale?: Locale;
  date: string;
  coverImage: string;
  tags?: string[];
};

export type LearningSummary = LearningFrontmatter & {
  slug: string;
};

export type LearningHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

export type LearningEntry = LearningSummary & {
  content: string;
  headings: LearningHeading[];
};

export type AdjacentLearningEntries = {
  previous: LearningSummary | null;
  next: LearningSummary | null;
};
