import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllLearningEntries } from "@/lib/learning";
import { getAllPosts } from "@/lib/posts";
import { DEFAULT_DESCRIPTION, SITE_NAME, getAbsoluteUrl } from "@/lib/metadata";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const posts = getAllPosts();
  const cyclingEntries = getAllCyclingEntries();
  const learningEntries = getAllLearningEntries();
  const siteUrl = getAbsoluteUrl("/");
  const rssUrl = getAbsoluteUrl("/rss.xml");

  const feedEntries = [
    ...posts.map((post) => ({
      title: post.title,
      url: getAbsoluteUrl(`/posts/${post.slug}`),
      date: post.date,
      excerpt: post.excerpt,
      category: post.category,
    })),
    ...cyclingEntries.map((entry) => ({
      title: entry.title,
      url: getAbsoluteUrl(`/cycling/${entry.slug}`),
      date: entry.rideDate,
      excerpt: entry.excerpt,
      category: `${entry.location.region} · Cycling`,
    })),
    ...learningEntries.map((entry) => ({
      title: entry.title,
      url: getAbsoluteUrl(`/learning/${entry.slug}`),
      date: entry.date,
      excerpt: entry.excerpt,
      category: "Learning · Godot",
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${rssUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
