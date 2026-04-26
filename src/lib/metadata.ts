import type { Metadata } from "next";

export const SITE_NAME = "TJ Adventure";
export const DEFAULT_DESCRIPTION =
  "Family travel stories, route notes, and practical trip guides you can actually reuse.";
export const DEFAULT_OG_IMAGE = "/branding/TJ_Adventure_patagonia_banner.jpg";
const DEFAULT_SITE_URL = "http://localhost:3000";

type PageMetadataInput = {
  title: string;
  description: string;
  pathname: string;
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
  image = DEFAULT_OG_IMAGE,
  keywords,
  type = "website",
  publishedTime,
  section,
  tags,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    keywords,
    openGraph: {
      title,
      description,
      url: pathname,
      siteName: SITE_NAME,
      images: [{ url: image }],
      locale: "zh_CN",
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

export function getSiteMetadataDefaults(): Metadata {
  return {
    metadataBase: getMetadataBase(),
    applicationName: SITE_NAME,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
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
      description: DEFAULT_DESCRIPTION,
      siteName: SITE_NAME,
      locale: "zh_CN",
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
