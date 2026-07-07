import { describe, expect, it } from "vitest";
import { parseLearningFrontmatter } from "@/lib/learning";

function validLearningData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Getting started with Godot",
    excerpt: "First steps learning the Godot engine.",
    locale: "zh-CN",
    translationKey: "godot-getting-started",
    date: "2026-03-09",
    ...overrides,
  };
}

describe("parseLearningFrontmatter", () => {
  it("parses a valid frontmatter object", () => {
    const result = parseLearningFrontmatter(validLearningData(), "fixture.mdx", "zh-CN");
    expect(result.title).toBe("Getting started with Godot");
    expect(result.date).toBe("2026-03-09");
  });

  it("falls back to the placeholder cover image when omitted", () => {
    const result = parseLearningFrontmatter(validLearningData(), "fixture.mdx", "zh-CN");
    expect(result.coverImage).toBe("/learning/cover-placeholder.jpg");
  });

  it("accepts a provided local coverImage", () => {
    const result = parseLearningFrontmatter(
      validLearningData({ coverImage: "/learning/godot/cover.jpg" }),
      "fixture.mdx",
      "zh-CN",
    );
    expect(result.coverImage).toBe("/learning/godot/cover.jpg");
  });

  it("rejects a coverImage that is neither a local path nor an http(s) URL", () => {
    expect(() =>
      parseLearningFrontmatter(validLearningData({ coverImage: "cdn.example.com/x.jpg" }), "fixture.mdx", "zh-CN"),
    ).toThrow(/must be an absolute path.*or an http\(s\) URL/);
  });

  it("rejects a malformed date", () => {
    expect(() => parseLearningFrontmatter(validLearningData({ date: "2026-02-30" }), "fixture.mdx", "zh-CN")).toThrow(
      /not a valid calendar date/,
    );
  });

  it("rejects a locale/directory mismatch", () => {
    expect(() =>
      parseLearningFrontmatter(validLearningData({ locale: "en-US" }), "fixture.mdx", "zh-CN"),
    ).toThrow(/must match its content directory/);
  });

  it("trims and returns tags", () => {
    const result = parseLearningFrontmatter(
      validLearningData({ tags: [" gdscript ", "shaders"] }),
      "fixture.mdx",
      "zh-CN",
    );
    expect(result.tags).toEqual(["gdscript", "shaders"]);
  });
});
