import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileWithMtimeCache } from "@/lib/content-cache";

let tmpDir: string;
let filePath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "content-cache-test-"));
  filePath = path.join(tmpDir, "fixture.txt");
  fs.writeFileSync(filePath, "v1");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("readFileWithMtimeCache", () => {
  it("computes the value on the first call", () => {
    let computeCalls = 0;
    const value = readFileWithMtimeCache(filePath, () => {
      computeCalls += 1;
      return "computed";
    });

    expect(value).toBe("computed");
    expect(computeCalls).toBe(1);
  });

  it("reuses the cached value while the file's mtime is unchanged", () => {
    let computeCalls = 0;
    const compute = () => {
      computeCalls += 1;
      return `call-${computeCalls}`;
    };

    const first = readFileWithMtimeCache(filePath, compute);
    const second = readFileWithMtimeCache(filePath, compute);

    expect(second).toBe(first);
    expect(computeCalls).toBe(1);
  });

  it("recomputes after the file is modified", async () => {
    let computeCalls = 0;
    const compute = () => {
      computeCalls += 1;
      return `call-${computeCalls}`;
    };

    const first = readFileWithMtimeCache(filePath, compute);

    // Ensure a strictly later mtime: some filesystems have coarse mtime resolution.
    const futureTime = new Date(Date.now() + 5000);
    fs.writeFileSync(filePath, "v2");
    fs.utimesSync(filePath, futureTime, futureTime);

    const second = readFileWithMtimeCache(filePath, compute);

    expect(second).not.toBe(first);
    expect(computeCalls).toBe(2);
  });

  it("caches distinct files independently", () => {
    const otherPath = path.join(tmpDir, "other.txt");
    fs.writeFileSync(otherPath, "other");

    const value = readFileWithMtimeCache(filePath, () => "fixture-value");
    const otherValue = readFileWithMtimeCache(otherPath, () => "other-value");

    expect(value).toBe("fixture-value");
    expect(otherValue).toBe("other-value");
  });
});
