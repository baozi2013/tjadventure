export type HighlightRange = readonly [number, number];

export type TextSegment = {
  text: string;
  highlighted: boolean;
};

/**
 * Splits `text` into segments by `ranges` (inclusive start/end index pairs,
 * matching Fuse.js's `FuseResultMatch.indices` convention). Overlapping or
 * unsorted ranges are handled by merging as they're consumed.
 */
function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];

  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

export function splitByHighlightRanges(text: string, ranges: HighlightRange[] | undefined): TextSegment[] {
  if (!ranges || ranges.length === 0) {
    return [{ text, highlighted: false }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const [start, end] of mergeRanges(ranges)) {
    const from = Math.max(start, cursor);
    const to = Math.min(end, text.length - 1);
    if (from > to) continue;

    if (from > cursor) {
      segments.push({ text: text.slice(cursor, from), highlighted: false });
    }
    segments.push({ text: text.slice(from, to + 1), highlighted: true });
    cursor = to + 1;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }

  return segments;
}
