import { describe, expect, it } from "vitest";
import { parsePostFrontmatter } from "@/lib/posts";

function validPostData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Lake Tahoe Weekend",
    excerpt: "A short weekend loop around Lake Tahoe.",
    locale: "zh-CN",
    translationKey: "lake-tahoe-weekend",
    date: "2026-03-09",
    category: "US · California",
    readTime: "8 min",
    coverImage: "/trips/lake-tahoe/cover.jpg",
    ...overrides,
  };
}

describe("parsePostFrontmatter", () => {
  it("parses a valid frontmatter object", () => {
    const result = parsePostFrontmatter(validPostData(), "fixture.mdx", "zh-CN");
    expect(result).toMatchObject({
      title: "Lake Tahoe Weekend",
      date: "2026-03-09",
      category: "US · California",
      readTime: "8 min",
      coverImage: "/trips/lake-tahoe/cover.jpg",
    });
  });

  it("rejects frontmatter that is not an object", () => {
    expect(() => parsePostFrontmatter(null, "fixture.mdx", "zh-CN")).toThrow(/frontmatter must be an object/);
    expect(() => parsePostFrontmatter("nope", "fixture.mdx", "zh-CN")).toThrow(/frontmatter must be an object/);
  });

  it("rejects a locale that does not match its content directory", () => {
    expect(() => parsePostFrontmatter(validPostData({ locale: "en-US" }), "fixture.mdx", "zh-CN")).toThrow(
      /must match its content directory/,
    );
  });

  it("rejects a malformed date", () => {
    expect(() => parsePostFrontmatter(validPostData({ date: "03/09/2026" }), "fixture.mdx", "zh-CN")).toThrow(
      /must use YYYY-MM-DD format/,
    );
  });

  it("rejects a category that doesn't follow 'Region · Theme'", () => {
    expect(() => parsePostFrontmatter(validPostData({ category: "California" }), "fixture.mdx", "zh-CN")).toThrow(
      /must follow "Region · Theme" format/,
    );
  });

  it("rejects a readTime that doesn't match '<number> min'", () => {
    expect(() => parsePostFrontmatter(validPostData({ readTime: "8 minutes" }), "fixture.mdx", "zh-CN")).toThrow(
      /must follow "<number> min" format/,
    );
  });

  it("rejects a coverImage that is neither a local path nor an http(s) URL", () => {
    expect(() =>
      parsePostFrontmatter(validPostData({ coverImage: "cdn.example.com/x.jpg" }), "fixture.mdx", "zh-CN"),
    ).toThrow(/must be an absolute path.*or an http\(s\) URL/);
  });

  it("rejects a translationKey with uppercase letters", () => {
    expect(() =>
      parsePostFrontmatter(validPostData({ translationKey: "Lake-Tahoe" }), "fixture.mdx", "zh-CN"),
    ).toThrow(/lowercase letters, numbers, and hyphens/);
  });

  it("rejects an empty locations array", () => {
    expect(() => parsePostFrontmatter(validPostData({ locations: [] }), "fixture.mdx", "zh-CN")).toThrow(
      /"locations" cannot be an empty array/,
    );
  });

  it("rejects a location with an out-of-range latitude", () => {
    expect(() =>
      parsePostFrontmatter(
        validPostData({ locations: [{ name: "Somewhere", lat: 200, lng: 0 }] }),
        "fixture.mdx",
        "zh-CN",
      ),
    ).toThrow(/must be in range \[-90, 90\]/);
  });

  it("accepts valid locations", () => {
    const result = parsePostFrontmatter(
      validPostData({ locations: [{ name: "Kings Beach", lat: 39.24, lng: -120.03 }] }),
      "fixture.mdx",
      "zh-CN",
    );
    expect(result.locations).toEqual([{ name: "Kings Beach", lat: 39.24, lng: -120.03, note: undefined, image: undefined }]);
  });

  it("rejects a non-boolean featured flag", () => {
    expect(() => parsePostFrontmatter(validPostData({ featured: "yes" }), "fixture.mdx", "zh-CN")).toThrow(
      /"featured" must be a boolean/,
    );
  });

  it("rejects a non-integer featuredOrder", () => {
    expect(() => parsePostFrontmatter(validPostData({ featuredOrder: 1.5 }), "fixture.mdx", "zh-CN")).toThrow(
      /"featuredOrder" must be an integer/,
    );
  });

  it("accepts a valid featured flag and order", () => {
    const result = parsePostFrontmatter(validPostData({ featured: true, featuredOrder: 1 }), "fixture.mdx", "zh-CN");
    expect(result.featured).toBe(true);
    expect(result.featuredOrder).toBe(1);
  });
});
