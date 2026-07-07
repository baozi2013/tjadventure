import type { Locale } from "@/i18n/routing";
import type { ContentHeading } from "@/lib/content-frontmatter";

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

export type LearningHeading = ContentHeading;

export type LearningEntry = LearningSummary & {
  content: string;
  headings: LearningHeading[];
};

export type AdjacentLearningEntries = {
  previous: LearningSummary | null;
  next: LearningSummary | null;
};
