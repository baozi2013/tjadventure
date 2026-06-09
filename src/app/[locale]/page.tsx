import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";
import { resolveLocale, type LocaleParams } from "@/i18n/locale";

type PageProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Home" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/",
    locale,
    keywords: ["family travel blog", "travel stories", "road trip planning", "trip highlights"],
  });
}

export default async function Home({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });
  const allPosts = getAllPosts(locale);
  const highlightSlugsInOrder = ["maui-2025-family-trip", "teton-yellowstone-2024"];
  const preferredHighlights = highlightSlugsInOrder
    .map((slug) => allPosts.find((post) => post.slug === slug))
    .filter((post): post is (typeof allPosts)[number] => Boolean(post));
  const fallbackHighlights = allPosts.filter((post) => !preferredHighlights.some((item) => item.slug === post.slug));
  const seasonalHighlights = [...preferredHighlights, ...fallbackHighlights].slice(0, 3);
  const highlightSlugs = new Set(seasonalHighlights.map((post) => post.slug));
  const recentPosts = allPosts.filter((post) => !highlightSlugs.has(post.slug)).slice(0, 9);
  const regions = Array.from(new Set(allPosts.map((post) => post.category.split(" · ")[0]))).slice(0, 4);

  if (allPosts.length === 0) {
    return <main className="mx-auto max-w-4xl px-6 py-20">{t("empty")}</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="home" />

      <header className="mb-10 overflow-hidden rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-9">
        <p className="text-xs tracking-[0.2em] text-neutral-500">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          {t("intro")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/trips"
            className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold !text-white shadow-sm shadow-black/10 transition hover:bg-neutral-800 dark:border-white/20 dark:bg-neutral-100 dark:!text-neutral-950 dark:hover:bg-white"
          >
            {t("primaryCta")}
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            {t("secondaryCta")}
          </Link>
        </div>
        <div className="mt-8 grid gap-3 border-t border-black/10 pt-6 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-300 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("readerPathLabel")}</p>
            <p className="mt-2">{t("readerPath")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("coverageLabel")}</p>
            <p className="mt-2">{t("coverage", { count: allPosts.length, regions: regions.join(" / ") })}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("publishingLabel")}</p>
            <p className="mt-2">{t("publishing")}</p>
          </div>
        </div>
      </header>

      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between">
          <h3 className="text-xl font-semibold">{t("seasonalTitle")}</h3>
          <p className="text-sm text-neutral-500">{t("seasonalSubtitle")}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seasonalHighlights.map((post, index) => (
            <PostCard key={post.slug} post={post} priority={index === 0} size="feature" />
          ))}
        </div>
      </section>

      <section id="all-trips">
        <div className="mb-5 flex items-end justify-between">
          <h3 className="text-xl font-semibold">{t("recentTitle")}</h3>
          <Link href="/trips" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            {t("viewAll")}
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <p className="rounded-2xl border border-black/10 bg-white px-5 py-6 text-sm text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
            {t("moreSoon")}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
