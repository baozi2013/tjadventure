import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh-CN", "en-US"],
  defaultLocale: "zh-CN",
  localeDetection: false,
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "en-US": "/en",
    },
  },
});

export type Locale = (typeof routing.locales)[number];

export function isSupportedLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

export function stripLocalePrefix(pathname: string) {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  if (pathname === "/zh-CN") return "/";
  if (pathname.startsWith("/zh-CN/")) return pathname.slice(6) || "/";
  return pathname || "/";
}

export function getLocalizedPathname(pathname: string, locale: Locale) {
  const cleanPathname = stripLocalePrefix(pathname);
  const normalizedPathname = cleanPathname.startsWith("/") ? cleanPathname : `/${cleanPathname}`;

  if (locale === "en-US") {
    return normalizedPathname === "/" ? "/en" : `/en${normalizedPathname}`;
  }

  return normalizedPathname;
}

export function getLocalizedHref(href: string, locale: Locale) {
  if (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const hrefWithoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = hrefWithoutHash.indexOf("?");
  const query = queryIndex >= 0 ? hrefWithoutHash.slice(queryIndex) : "";
  const pathname = queryIndex >= 0 ? hrefWithoutHash.slice(0, queryIndex) : hrefWithoutHash;

  return `${getLocalizedPathname(pathname || "/", locale)}${query}${hash}`;
}
