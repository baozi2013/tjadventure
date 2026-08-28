import type { MetadataRoute } from "next";
import { getAllCyclingEntries } from "@/lib/cycling";
import { getAllLearningEntries } from "@/lib/learning";
import { getAllPosts } from "@/lib/posts";
import { getAbsoluteUrl } from "@/lib/metadata";
import { getLocalizedPathname, routing, type Locale } from "@/i18n/routing";

type LocalizedRouteInput = {
  pathname: string;
  lastModified: Date;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

type LocalizedPathname = {
  locale: Locale;
  pathname: string;
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

function getContentAlternates(pathnames: LocalizedPathname[]) {
  const languages = Object.fromEntries(
    pathnames.map(({ locale, pathname }) => [locale, getAbsoluteUrl(getLocalizedPathname(pathname, locale))]),
  ) as Record<string, string>;
  const defaultPathname = pathnames.find((item) => item.locale === routing.defaultLocale) ?? pathnames[0];

  if (defaultPathname) {
    languages["x-default"] = getAbsoluteUrl(getLocalizedPathname(defaultPathname.pathname, defaultPathname.locale));
  }

  return { languages };
}

function groupByTranslationKey<T extends { translationKey: string }>(items: T[]) {
  return items.reduce((map, item) => {
    const current = map.get(item.translationKey) ?? [];
    current.push(item);
    map.set(item.translationKey, current);
    return map;
  }, new Map<string, T[]>());
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
      pathname: "/learning",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
    ...createLocalizedRoutes({
      pathname: "/map",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
    ...createLocalizedRoutes({
      pathname: "/tags",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    }),
    ...createLocalizedRoutes({
      pathname: "/stats",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
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

  const localizedPosts = routing.locales.flatMap((locale) =>
    getAllPosts(locale).map((post) => ({
      locale,
      translationKey: post.translationKey,
      post,
      pathname: `/posts/${post.slug}`,
    })),
  );
  const postRoutes: MetadataRoute.Sitemap = Array.from(groupByTranslationKey(localizedPosts).values()).flatMap(
    (items) => {
      const pathnames = items.map(({ locale, pathname }) => ({ locale, pathname }));
      const alternates = getContentAlternates(pathnames);

      return items.map(({ locale, pathname, post }) => ({
        url: getAbsoluteUrl(getLocalizedPathname(pathname, locale)),
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates,
      }));
    },
  );

  const localizedCyclingEntries = routing.locales.flatMap((locale) =>
    getAllCyclingEntries(locale).map((entry) => ({
      locale,
      translationKey: entry.translationKey,
      entry,
      pathname: `/cycling/${entry.slug}`,
    })),
  );
  const cyclingRoutes: MetadataRoute.Sitemap = Array.from(groupByTranslationKey(localizedCyclingEntries).values()).flatMap(
    (items) => {
      const pathnames = items.map(({ locale, pathname }) => ({ locale, pathname }));
      const alternates = getContentAlternates(pathnames);

      return items.map(({ locale, pathname, entry }) => ({
        url: getAbsoluteUrl(getLocalizedPathname(pathname, locale)),
        lastModified: new Date(entry.rideDate),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates,
      }));
    },
  );

  const localizedLearningEntries = routing.locales.flatMap((locale) =>
    getAllLearningEntries(locale).map((entry) => ({
      locale,
      translationKey: entry.translationKey,
      entry,
      pathname: `/learning/${entry.slug}`,
    })),
  );
  const learningRoutes: MetadataRoute.Sitemap = Array.from(
    groupByTranslationKey(localizedLearningEntries).values(),
  ).flatMap((items) => {
    const pathnames = items.map(({ locale, pathname }) => ({ locale, pathname }));
    const alternates = getContentAlternates(pathnames);

    return items.map(({ locale, pathname, entry }) => ({
      url: getAbsoluteUrl(getLocalizedPathname(pathname, locale)),
      lastModified: new Date(entry.date),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates,
    }));
  });

  return [...staticRoutes, ...postRoutes, ...cyclingRoutes, ...learningRoutes];
}
