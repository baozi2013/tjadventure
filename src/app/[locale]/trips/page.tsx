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
  const t = await getTranslations({ locale, namespace: "Trips" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/trips",
    locale,
    keywords: ["all trips", "trip archive", "travel destinations", "travel posts"],
  });
}

export default async function TripsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Trips" });
  const allPosts = getAllPosts(locale);
  const groupedPosts = Array.from(
    allPosts.reduce((map, post) => {
      const region = post.category.split(" · ")[0];
      const current = map.get(region) ?? [];
      current.push(post);
      map.set(region, current);
      return map;
    }, new Map<string, typeof allPosts>()),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="trips" />

      <header className="mb-8 rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          {t("intro")}
        </p>
        <div className="mt-5">
          <Link
            href="/search"
            className="inline-flex rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold !text-white shadow-sm shadow-black/10 transition hover:bg-neutral-800 dark:border-white/20 dark:bg-white dark:!text-neutral-950 dark:hover:bg-neutral-100"
          >
            {t("searchCta")}
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-300">
          {groupedPosts.map(([region, posts]) => (
            <a
              key={region}
              href={`#region-${region.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full border border-black/10 px-3 py-1 transition hover:bg-neutral-100 dark:border-white/15 dark:hover:bg-neutral-900"
            >
              {region} · {posts.length}
            </a>
          ))}
        </div>
      </header>

      {allPosts.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("empty")}</p>
      ) : (
        <div className="space-y-10">
          {groupedPosts.map(([region, posts]) => (
            <section key={region} id={`region-${region.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("region")}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{region}</h2>
                </div>
                <p className="text-sm text-neutral-500">{t("count", { count: posts.length })}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
