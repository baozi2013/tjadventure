import { describe, expect, it } from "vitest";
import { getAllSearchEntries, getAllTags, getEntriesByTag } from "@/lib/tags";
import { getSearchIndex } from "@/lib/posts";
import { getCyclingSearchIndex } from "@/lib/cycling";
import { getLearningSearchIndex } from "@/lib/learning";

describe("getAllSearchEntries", () => {
  it("combines posts, cycling, and learning entries", () => {
    const entries = getAllSearchEntries("zh-CN");
    const expectedCount =
      getSearchIndex("zh-CN").length + getCyclingSearchIndex("zh-CN").length + getLearningSearchIndex("zh-CN").length;

    expect(entries.length).toBe(expectedCount);
  });
});

describe("getAllTags", () => {
  it("returns a non-empty list of tags sorted by count descending", () => {
    const tags = getAllTags("zh-CN");

    expect(tags.length).toBeGreaterThan(0);
    for (let i = 1; i < tags.length; i += 1) {
      expect(tags[i - 1].count).toBeGreaterThanOrEqual(tags[i].count);
    }
  });

  it("counts each tag's occurrences correctly", () => {
    const tags = getAllTags("zh-CN");
    const entries = getAllSearchEntries("zh-CN");

    for (const { tag, count } of tags) {
      const actualCount = entries.filter((entry) => entry.tags.includes(tag)).length;
      expect(count).toBe(actualCount);
    }
  });

  it("has no duplicate tags", () => {
    const tags = getAllTags("zh-CN");
    const uniqueTags = new Set(tags.map((item) => item.tag));

    expect(uniqueTags.size).toBe(tags.length);
  });
});

describe("getEntriesByTag", () => {
  it("returns only entries that include the given tag, sorted by date descending", () => {
    const [{ tag }] = getAllTags("zh-CN");
    const entries = getEntriesByTag(tag, "zh-CN");

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.tags.includes(tag))).toBe(true);

    for (let i = 1; i < entries.length; i += 1) {
      expect(new Date(entries[i - 1].date).getTime()).toBeGreaterThanOrEqual(new Date(entries[i].date).getTime());
    }
  });

  it("returns an empty array for a tag that doesn't exist", () => {
    expect(getEntriesByTag("__nonexistent-tag__", "zh-CN")).toEqual([]);
  });
});
