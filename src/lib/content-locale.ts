import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/routing";

export const DEFAULT_CONTENT_LOCALE: Locale = "zh-CN";

export function getLocalizedContentPath(baseDir: string, localizedDir: string, fileName: string, locale = DEFAULT_CONTENT_LOCALE) {
  const basePath = path.join(baseDir, fileName);

  if (locale === "en-US") {
    const localizedPath = path.join(localizedDir, fileName);
    if (fs.existsSync(localizedPath)) {
      return localizedPath;
    }
  }

  return basePath;
}

export function hasEnglishContent(localizedDir: string, fileName: string) {
  return fs.existsSync(path.join(localizedDir, fileName));
}
