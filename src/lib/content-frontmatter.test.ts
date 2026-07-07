import { describe, expect, it } from "vitest";
import {
  extractHeadings,
  makeFrontmatterFail,
  parseLatLng,
  readOptionalStringArray,
  readRequiredText,
  slugify,
  validateAssetPath,
  validateCalendarDate,
  validateLocalAssetPath,
  validateTranslationKey,
  type Fail,
} from "@/lib/content-frontmatter";

const fail: Fail = makeFrontmatterFail("test", "fixture.mdx");

describe("validateCalendarDate", () => {
  it("accepts a valid calendar date", () => {
    expect(validateCalendarDate("2026-03-09", "date", fail)).toBe("2026-03-09");
  });

  it("rejects a malformed date string", () => {
    expect(() => validateCalendarDate("2026/03/09", "date", fail)).toThrow(/must use YYYY-MM-DD format/);
  });

  it("rejects a calendar date that overflows (Feb 30)", () => {
    expect(() => validateCalendarDate("2026-02-30", "date", fail)).toThrow(/not a valid calendar date/);
  });

  it("rejects a calendar date that overflows (month 13)", () => {
    expect(() => validateCalendarDate("2026-13-01", "date", fail)).toThrow(/not a valid calendar date/);
  });

  it("accepts leap-day Feb 29 on a leap year", () => {
    expect(validateCalendarDate("2024-02-29", "date", fail)).toBe("2024-02-29");
  });

  it("rejects Feb 29 on a non-leap year", () => {
    expect(() => validateCalendarDate("2026-02-29", "date", fail)).toThrow(/not a valid calendar date/);
  });
});

describe("parseLatLng", () => {
  it("accepts a valid latitude", () => {
    expect(parseLatLng(35.6812, "lat", "lat", fail)).toBe(35.6812);
  });

  it("accepts a numeric string", () => {
    expect(parseLatLng("139.7671", "lng", "lng", fail)).toBeCloseTo(139.7671);
  });

  it("rejects a non-numeric value", () => {
    expect(() => parseLatLng("not-a-number", "lat", "lat", fail)).toThrow(/must be a valid number/);
  });

  it("rejects latitude above 90", () => {
    expect(() => parseLatLng(91, "lat", "lat", fail)).toThrow(/must be in range \[-90, 90\]/);
  });

  it("rejects latitude below -90", () => {
    expect(() => parseLatLng(-91, "lat", "lat", fail)).toThrow(/must be in range \[-90, 90\]/);
  });

  it("rejects longitude above 180", () => {
    expect(() => parseLatLng(181, "lng", "lng", fail)).toThrow(/must be in range \[-180, 180\]/);
  });

  it("rejects longitude below -180", () => {
    expect(() => parseLatLng(-181, "lng", "lng", fail)).toThrow(/must be in range \[-180, 180\]/);
  });

  it("accepts boundary values", () => {
    expect(parseLatLng(90, "lat", "lat", fail)).toBe(90);
    expect(parseLatLng(-90, "lat", "lat", fail)).toBe(-90);
    expect(parseLatLng(180, "lng", "lng", fail)).toBe(180);
    expect(parseLatLng(-180, "lng", "lng", fail)).toBe(-180);
  });
});

describe("validateTranslationKey", () => {
  it("accepts lowercase letters, numbers, and hyphens", () => {
    expect(validateTranslationKey("lake-tahoe-2024", fail)).toBe("lake-tahoe-2024");
  });

  it("rejects uppercase letters", () => {
    expect(() => validateTranslationKey("Lake-Tahoe", fail)).toThrow(/lowercase letters, numbers, and hyphens/);
  });

  it("rejects a key starting with a hyphen", () => {
    expect(() => validateTranslationKey("-lake-tahoe", fail)).toThrow(/lowercase letters, numbers, and hyphens/);
  });

  it("rejects spaces", () => {
    expect(() => validateTranslationKey("lake tahoe", fail)).toThrow(/lowercase letters, numbers, and hyphens/);
  });
});

describe("validateLocalAssetPath", () => {
  it("accepts a normal local path", () => {
    expect(validateLocalAssetPath("/trips/lake-tahoe/cover.jpg", "coverImage", fail)).toBe(
      "/trips/lake-tahoe/cover.jpg",
    );
  });

  it("rejects a path with no leading slash", () => {
    expect(() => validateLocalAssetPath("trips/lake-tahoe/cover.jpg", "coverImage", fail)).toThrow(
      /must start with "\/"/,
    );
  });

  it("rejects a protocol-relative URL", () => {
    expect(() => validateLocalAssetPath("//evil.example.com/x.jpg", "coverImage", fail)).toThrow(
      /protocol-relative/,
    );
  });

  it("rejects path traversal", () => {
    expect(() => validateLocalAssetPath("/trips/../../etc/passwd", "coverImage", fail)).toThrow(
      /must not contain "\.\." segments/,
    );
  });
});

describe("validateAssetPath", () => {
  it("accepts an http(s) URL", () => {
    expect(validateAssetPath("https://res.cloudinary.com/demo/image.jpg", "coverImage", fail)).toBe(
      "https://res.cloudinary.com/demo/image.jpg",
    );
  });

  it("accepts a local path", () => {
    expect(validateAssetPath("/trips/x/cover.jpg", "coverImage", fail)).toBe("/trips/x/cover.jpg");
  });

  it("rejects a bare domain with no protocol", () => {
    expect(() => validateAssetPath("cdn.example.com/image.jpg", "coverImage", fail)).toThrow(
      /must be an absolute path.*or an http\(s\) URL/,
    );
  });
});

describe("readRequiredText / readOptionalStringArray", () => {
  it("trims required text", () => {
    expect(readRequiredText({ title: "  Hello World  " }, "title", fail)).toBe("Hello World");
  });

  it("rejects empty required text", () => {
    expect(() => readRequiredText({ title: "   " }, "title", fail)).toThrow(/must be a non-empty string/);
  });

  it("returns undefined for a missing optional array", () => {
    expect(readOptionalStringArray({}, "tags", fail)).toBeUndefined();
  });

  it("trims each tag", () => {
    expect(readOptionalStringArray({ tags: [" a ", "b"] }, "tags", fail)).toEqual(["a", "b"]);
  });

  it("rejects a non-array value", () => {
    expect(() => readOptionalStringArray({ tags: "a,b" }, "tags", fail)).toThrow(/must be an array of strings/);
  });

  it("allows an empty array by default", () => {
    expect(readOptionalStringArray({ tags: [] }, "tags", fail)).toEqual([]);
  });

  it("rejects an empty array when allowEmpty is false", () => {
    expect(() => readOptionalStringArray({ tags: [] }, "tags", fail, { allowEmpty: false })).toThrow(
      /cannot be an empty array/,
    );
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses repeated separators", () => {
    expect(slugify("Hello   World///Trip")).toBe("hello-world-trip");
  });

  it("keeps CJK characters", () => {
    expect(slugify("旧金山 之旅")).toBe("旧金山-之旅");
  });

  it("strips punctuation", () => {
    expect(slugify("What's Next?!")).toBe("whats-next");
  });
});

describe("extractHeadings", () => {
  it("extracts level 2 and 3 markdown headings with slug ids", () => {
    const content = ["## Ride Summary", "text", "### Route Notes", "more text"].join("\n");
    expect(extractHeadings(content)).toEqual([
      { level: 2, text: "Ride Summary", id: "ride-summary" },
      { level: 3, text: "Route Notes", id: "route-notes" },
    ]);
  });

  it("returns an empty array when there are no headings", () => {
    expect(extractHeadings("just some text\nno headings here")).toEqual([]);
  });

  it("ignores level 1 and level 4+ headings", () => {
    expect(extractHeadings("# Title\n#### Deep heading")).toEqual([]);
  });
});
