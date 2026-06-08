import type { MetadataRoute } from "next";
import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllPosts } from "@/lib/posts";
import { getAbsoluteUrl } from "@/lib/metadata";
import { getLocalizedPathname, routing, type Locale } from "@/i18n/routing";

type LocalizedRouteInput = {
  pathname: string;
  lastModified: Date;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

function getLocalizedAlternates(pathname: string) {
  return {
    languages: {
      "zh-CN": getAbsoluteUrl(getLocalizedPathname(pathname, "zh-CN")),
      "en-US": getAbsoluteUrl(getLocalizedPathname(pathname, "en-US")),
      "x-default": getAbsoluteUrl(getLocalizedPathname(pathname, "zh-CN")),
    },
  };
}

function createLocalizedRoutes({
  pathname,
  lastModified,
  changeFrequency,
  priority,
}: LocalizedRouteInput): MetadataRoute.Sitemap {
  return routing.locales.map((locale: Locale) => ({
    url: getAbsoluteUrl(getLocalizedPathname(pathname, locale)),
    lastModified,
    changeFrequency,
    priority,
    alternates: getLocalizedAlternates(pathname),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    ...createLocalizedRoutes({
      pathname: "/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    }),
    ...createLocalizedRoutes({
      pathname: "/trips",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    ...createLocalizedRoutes({
      pathname: "/cycling",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    ...createLocalizedRoutes({
      pathname: "/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }),
    ...createLocalizedRoutes({
      pathname: "/gears",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  ];

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().flatMap((post) =>
    createLocalizedRoutes({
      pathname: `/posts/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const cyclingRoutes: MetadataRoute.Sitemap = getAllCyclingEntries().flatMap((entry) =>
    createLocalizedRoutes({
      pathname: `/cycling/${entry.slug}`,
      lastModified: new Date(entry.rideDate),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  return [...staticRoutes, ...postRoutes, ...cyclingRoutes];
}
