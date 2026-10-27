import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

type Dimensions = { width: number; height: number };

const PUBLIC_DIR = path.join(process.cwd(), "public");
const cache = new Map<string, Dimensions | null>();

// EXIF orientations 5-8 rotate the image 90°, so the displayed width/height swap.
const ROTATED_ORIENTATIONS = new Set([5, 6, 7, 8]);

/**
 * Reads the intrinsic size of an image under /public so Markdown images reserve the
 * right aspect ratio. Returns null when the file is missing or unreadable (e.g. at
 * runtime where /public isn't traced), letting callers fall back to defaults.
 */
export function getLocalImageDimensions(src: string): Dimensions | null {
  const pathname = src.split(/[?#]/, 1)[0];
  if (cache.has(pathname)) {
    return cache.get(pathname) ?? null;
  }

  let result: Dimensions | null = null;
  try {
    const filePath = path.join(PUBLIC_DIR, decodeURIComponent(pathname));
    if (filePath.startsWith(PUBLIC_DIR + path.sep)) {
      const { width, height, orientation } = imageSize(fs.readFileSync(filePath));
      if (width && height) {
        result = ROTATED_ORIENTATIONS.has(orientation ?? 1)
          ? { width: height, height: width }
          : { width, height };
      }
    }
  } catch {
    result = null;
  }

  cache.set(pathname, result);
  return result;
}
