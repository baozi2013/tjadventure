import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllLearningEntries } from "@/lib/learning";
import { getAllPosts } from "@/lib/posts";
import { DEFAULT_DESCRIPTIONS, SITE_NAME, getAbsoluteUrl } from "@/lib/metadata";
import { getLocalizedPathname, type Locale } from "@/i18n/routing";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildRssFeed(locale: Locale) {
  const posts = getAllPosts(locale);
  const cyclingEntries = getAllCyclingEntries(locale);
  const learningEntries = getAllLearningEntries(locale);
  const cyclingCategoryLabel = locale === "en-US" ? "Cycling" : "骑行";
  const learningCategoryLabel = locale === "en-US" ? "Learning · Godot" : "学习记录 · Godot";
  const siteUrl = getAbsoluteUrl(getLocalizedPathname("/", locale));
  const rssPathname = locale === "en-US" ? "/en/rss.xml" : "/rss.xml";
  const rssUrl = getAbsoluteUrl(rssPathname);

  const feedEntries = [
    ...posts.map((post) => ({
      title: post.title,
      url: getAbsoluteUrl(getLocalizedPathname(`/posts/${post.slug}`, locale)),
      date: post.date,
      excerpt: post.excerpt,
      category: post.category,
    })),
    ...cyclingEntries.map((entry) => ({
      title: entry.title,
      url: getAbsoluteUrl(getLocalizedPathname(`/cycling/${entry.slug}`, locale)),
      date: entry.rideDate,
      excerpt: entry.excerpt,
      category: `${entry.location.region} · ${cyclingCategoryLabel}`,
    })),
    ...learningEntries.map((entry) => ({
      title: entry.title,
      url: getAbsoluteUrl(getLocalizedPathname(`/learning/${entry.slug}`, locale)),
      date: entry.date,
      excerpt: entry.excerpt,
      category: learningCategoryLabel,
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const items = feedEntries
    .map((entry) => {
      return `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${entry.url}</link>
      <guid>${entry.url}</guid>
      <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
      <description>${escapeXml(entry.excerpt)}</description>
      <category>${escapeXml(entry.category)}</category>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(DEFAULT_DESCRIPTIONS[locale])}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${rssUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export function createRssResponse(locale: Locale) {
  return new Response(buildRssFeed(locale), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
