import { describe, expect, it } from "vitest";
import { buildRssFeed, createRssResponse } from "@/lib/rss";
import { getAllPosts } from "@/lib/posts";
import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllLearningEntries } from "@/lib/learning";

function countItemTags(xml: string) {
  return xml.match(/<item>/g)?.length ?? 0;
}

describe("buildRssFeed", () => {
  it("produces a well-formed RSS 2.0 document", () => {
    const xml = buildRssFeed("zh-CN");

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
    expect(xml.trim().endsWith("</rss>")).toBe(true);
  });

  it("includes one <item> per post, cycling entry, and learning entry", () => {
    const xml = buildRssFeed("zh-CN");
    const expectedCount =
      getAllPosts("zh-CN").length + getAllCyclingEntries("zh-CN").length + getAllLearningEntries("zh-CN").length;

    expect(countItemTags(xml)).toBe(expectedCount);
  });

  it("sorts items by date descending", () => {
    const xml = buildRssFeed("zh-CN");
    const pubDates = Array.from(xml.matchAll(/<pubDate>(.*?)<\/pubDate>/g)).map((match) => new Date(match[1]).getTime());

    for (let i = 1; i < pubDates.length; i += 1) {
      expect(pubDates[i - 1]).toBeGreaterThanOrEqual(pubDates[i]);
    }
  });

  it("escapes ampersands in titles rather than emitting them raw", () => {
    const xml = buildRssFeed("zh-CN");
    const titles = Array.from(xml.matchAll(/<title>(.*?)<\/title>/g)).map((match) => match[1]);
    const hasEscapedAmpersand = titles.some((title) => title.includes("&amp;"));
    const hasUnescapedEntity = titles.some((title) => /&(?!amp;|lt;|gt;|quot;|apos;)/.test(title));

    // Sanity check that this feed actually contains a title with an ampersand,
    // otherwise the assertion below would pass vacuously.
    expect(hasEscapedAmpersand).toBe(true);
    expect(hasUnescapedEntity).toBe(false);
  });

  it("uses the locale-specific feed URL and language", () => {
    const zhFeed = buildRssFeed("zh-CN");
    const enFeed = buildRssFeed("en-US");

    expect(zhFeed).toContain("<language>zh-CN</language>");
    expect(zhFeed).toContain('href="http://localhost:3000/rss.xml"');

    expect(enFeed).toContain("<language>en-US</language>");
    expect(enFeed).toContain('href="http://localhost:3000/en/rss.xml"');
  });
});

describe("createRssResponse", () => {
  it("returns an RSS response with the correct content type and body", async () => {
    const response = createRssResponse("zh-CN");

    expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    expect(await response.text()).toContain("<rss version=\"2.0\"");
  });
});
