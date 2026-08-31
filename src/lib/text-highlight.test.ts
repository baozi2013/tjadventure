import { describe, expect, it } from "vitest";
import { splitByHighlightRanges } from "@/lib/text-highlight";

describe("splitByHighlightRanges", () => {
  it("returns the whole text unhighlighted when there are no ranges", () => {
    expect(splitByHighlightRanges("Lake Tahoe", undefined)).toEqual([{ text: "Lake Tahoe", highlighted: false }]);
    expect(splitByHighlightRanges("Lake Tahoe", [])).toEqual([{ text: "Lake Tahoe", highlighted: false }]);
  });

  it("highlights a single range in the middle of the text", () => {
    expect(splitByHighlightRanges("Lake Tahoe Weekend", [[5, 9]])).toEqual([
      { text: "Lake ", highlighted: false },
      { text: "Tahoe", highlighted: true },
      { text: " Weekend", highlighted: false },
    ]);
  });

  it("highlights a range starting at index 0", () => {
    expect(splitByHighlightRanges("Tahoe", [[0, 4]])).toEqual([{ text: "Tahoe", highlighted: true }]);
  });

  it("highlights a range ending at the last character", () => {
    expect(splitByHighlightRanges("Lake Tahoe", [[5, 9]])).toEqual([
      { text: "Lake ", highlighted: false },
      { text: "Tahoe", highlighted: true },
    ]);
  });

  it("handles multiple non-adjacent ranges", () => {
    expect(splitByHighlightRanges("Big Sur camping trip", [[0, 2], [8, 14]])).toEqual([
      { text: "Big", highlighted: true },
      { text: " Sur ", highlighted: false },
      { text: "camping", highlighted: true },
      { text: " trip", highlighted: false },
    ]);
  });

  it("merges overlapping ranges instead of duplicating text", () => {
    expect(splitByHighlightRanges("Tahoe", [[0, 2], [1, 4]])).toEqual([{ text: "Tahoe", highlighted: true }]);
  });

  it("sorts unsorted ranges before applying them", () => {
    expect(splitByHighlightRanges("Big Sur", [[4, 6], [0, 2]])).toEqual([
      { text: "Big", highlighted: true },
      { text: " ", highlighted: false },
      { text: "Sur", highlighted: true },
    ]);
  });

  it("clamps a range that extends past the end of the text", () => {
    expect(splitByHighlightRanges("Tahoe", [[3, 100]])).toEqual([
      { text: "Tah", highlighted: false },
      { text: "oe", highlighted: true },
    ]);
  });
});
