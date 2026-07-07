import fs from "node:fs";

type CacheEntry<T> = {
  mtimeMs: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

// Content files only change between deploys (or live edits during `next dev`), so a
// module-level cache keyed by mtime avoids re-parsing every MDX file on every call
// to getAllPosts/getAllCyclingEntries/getAllLearningEntries while still picking up edits.
export function readFileWithMtimeCache<T>(fullPath: string, compute: () => T): T {
  const mtimeMs = fs.statSync(fullPath).mtimeMs;
  const cached = cache.get(fullPath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.value as T;
  }

  const value = compute();
  cache.set(fullPath, { mtimeMs, value });
  return value;
}
