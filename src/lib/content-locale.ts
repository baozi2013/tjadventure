import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/routing";

export const DEFAULT_CONTENT_LOCALE: Locale = "zh-CN";

type LocalizedContentPathOptions = {
  fallbackToDefault?: boolean;
};

export function getLocalizedContentDirectory(baseDir: string, localizedDir: string, locale = DEFAULT_CONTENT_LOCALE) {
  return locale === "en-US" ? localizedDir : baseDir;
}

export function getLocalizedContentPath(
  baseDir: string,
  localizedDir: string,
  fileName: string,
  locale = DEFAULT_CONTENT_LOCALE,
  { fallbackToDefault = true }: LocalizedContentPathOptions = {},
) {
  const basePath = path.join(baseDir, fileName);

  if (locale === "en-US") {
    const localizedPath = path.join(localizedDir, fileName);
    if (fs.existsSync(localizedPath) || !fallbackToDefault) {
      return localizedPath;
    }
  }

  return basePath;
}

export function hasLocalizedContent(
  baseDir: string,
  localizedDir: string,
  fileName: string,
  locale = DEFAULT_CONTENT_LOCALE,
) {
  return fs.existsSync(path.join(getLocalizedContentDirectory(baseDir, localizedDir, locale), fileName));
}
