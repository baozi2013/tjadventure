import type { Metadata } from "next";
import { getLocalizedPathname, type Locale } from "@/i18n/routing";

export const SITE_NAME = "TJ Adventure";
export const DEFAULT_DESCRIPTION =
  "Family travel stories, route notes, and practical trip guides you can actually reuse.";
export const DEFAULT_OG_IMAGE = "/branding/TJ_Adventure_patagonia_banner.jpg";
const DEFAULT_SITE_URL = "http://localhost:3000";

const DEFAULT_DESCRIPTIONS: Record<Locale, string> = {
  "zh-CN": "家庭旅行故事、路线笔记和可以真正复用的实用攻略。",
  "en-US": DEFAULT_DESCRIPTION,
};

const OG_LOCALES: Record<Locale, string> = {
  "zh-CN": "zh_CN",
  "en-US": "en_US",
};

type PageMetadataInput = {
  title: string;
  description: string;
  pathname: string;
  locale?: Locale;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  section?: string;
  tags?: string[];
};

function normalizeSiteUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return DEFAULT_SITE_URL;
  }

  const withProtocol = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/$/, "");
}

export function getSiteUrl() {
  return normalizeSiteUrl(
    process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL,
  );
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function getAbsoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, getMetadataBase()).toString();
}

export function createPageMetadata({
  title,
  description,
  pathname,
  locale = "zh-CN",
  image = DEFAULT_OG_IMAGE,
  keywords,
  type = "website",
  publishedTime,
  section,
  tags,
}: PageMetadataInput): Metadata {
  const canonical = getLocalizedPathname(pathname, locale);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": getLocalizedPathname(pathname, "zh-CN"),
        "en-US": getLocalizedPathname(pathname, "en-US"),
        "x-default": getLocalizedPathname(pathname, "zh-CN"),
      },
    },
    keywords,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image }],
      locale: OG_LOCALES[locale],
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(section ? { section } : {}),
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function getSiteMetadataDefaults(locale: Locale = "zh-CN"): Metadata {
  const description = DEFAULT_DESCRIPTIONS[locale];

  return {
    metadataBase: getMetadataBase(),
    applicationName: SITE_NAME,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    alternates: {
      canonical: getLocalizedPathname("/", locale),
      languages: {
        "zh-CN": getLocalizedPathname("/", "zh-CN"),
        "en-US": getLocalizedPathname("/", "en-US"),
        "x-default": getLocalizedPathname("/", "zh-CN"),
      },
    },
    keywords: [
      "travel blog",
      "family travel",
      "road trip guides",
      "trip itineraries",
      "TJ Adventure",
    ],
    authors: [{ name: "TJ Adventure" }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    openGraph: {
      title: SITE_NAME,
      description,
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      type: "website",
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [{ url: "/icon.png", type: "image/png" }],
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
  };
}
