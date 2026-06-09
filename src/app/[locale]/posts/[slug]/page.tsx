import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAdjacentPosts, getAllPosts, getPostBySlug, getRelatedPosts, type RelatedPost } from "@/lib/posts";
import { mdxComponents } from "@/components/mdx-components";
import { TripMap } from "@/components/trip-map";
import { createPageMetadata } from "@/lib/metadata";
import { getPairedCyclingEntryForPostSlug } from "@/lib/content-pairings";
import { StoryRideSwitch } from "@/components/story-ride-switch";
import { PostCard } from "@/components/post-card";
import { SiteNav } from "@/components/site-nav";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/locale";

type Params = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getAllPosts().map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const t = await getTranslations({ locale, namespace: "PostDetail" });
  const post = getPostBySlug(slug, locale);

  if (!post) {
    return createPageMetadata({
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
      pathname: `/posts/${slug}`,
      locale,
    });
  }

  return createPageMetadata({
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    pathname: `/posts/${slug}`,
    locale,
    image: post.frontmatter.coverImage,
    keywords: post.frontmatter.tags,
    type: "article",
    publishedTime: post.frontmatter.date,
    section: post.frontmatter.category,
    tags: post.frontmatter.tags,
  });
}

export default async function PostDetail({ params }: Params) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "PostDetail" });
  const { slug } = await params;
  const post = getPostBySlug(slug, locale);

  if (!post) notFound();

  const relatedPostLabels: Record<RelatedPost["relation"], string> = {
    "same-category": t("sameCategory"),
    "same-region": t("sameRegion"),
    "shared-tags": t("sharedTags"),
    recent: t("recent"),
  };

  const adjacentPosts = getAdjacentPosts(slug, locale);
  const relatedPosts = getRelatedPosts(slug, 3, locale);
  const pairedCyclingEntry = getPairedCyclingEntryForPostSlug(slug, locale);
  const postSummary = {
    slug: post.slug,
    ...post.frontmatter,
  };
  const region = post.frontmatter.category.split(" · ")[0];

  const { content } = await compileMDX({
    source: post.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
        ],
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8 lg:px-10">
      <SiteNav current="trips" />

      <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">{t("home")}</Link>
        <span>/</span>
        <Link href="/trips" className="hover:text-neutral-900 dark:hover:text-white">{t("trips")}</Link>
        <span>/</span>
        <span>{region}</span>
      </nav>

      <article className="mt-5 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <header className="mb-6 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-8">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              {post.frontmatter.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {post.frontmatter.title}
            </h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">{post.frontmatter.excerpt}</p>
            <p className="mt-3 text-xs text-neutral-500">
              {post.frontmatter.date} · {post.frontmatter.readTime}
            </p>
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 dark:border-white/15 dark:text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl sm:h-96">
            <Image
              src={post.frontmatter.coverImage}
              alt={post.frontmatter.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 860px"
              priority
            />
          </div>

          <TripMap
            title={post.frontmatter.title}
            locations={post.locations}
            fallbackImage={post.frontmatter.coverImage}
          />

          <section className="mb-8 grid gap-4 rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/10 dark:bg-neutral-950 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("region")}</p>
              <p className="mt-2 font-medium">{region}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("readingTime")}</p>
              <p className="mt-2 font-medium">{post.frontmatter.readTime}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("mapStops")}</p>
              <p className="mt-2 font-medium">{t("mapStopsCount", { count: post.locations.length })}</p>
            </div>
          </section>

          <StoryRideSwitch current="post" post={postSummary} cyclingEntry={pairedCyclingEntry} className="mb-8" />

          <div className="mdx-content max-w-none">
            {content}
          </div>

          {relatedPosts.length > 0 ? (
            <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("relatedEyebrow")}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{t("relatedTitle")}</h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-neutral-500">
                  {t("relatedDescription")}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <div key={relatedPost.slug} className="space-y-2">
                    <span className="inline-flex rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-500 dark:border-white/15">
                      {relatedPostLabels[relatedPost.relation]}
                    </span>
                    <PostCard post={relatedPost} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {(adjacentPosts.previous || adjacentPosts.next) ? (
            <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("continueEyebrow")}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{t("continueTitle")}</h2>
                </div>
                <Link href="/trips" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                  {t("allTrips")}
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {adjacentPosts.previous ? (
                  <Link
                    href={`/posts/${adjacentPosts.previous.slug}`}
                    className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("previous")}</p>
                    <h3 className="mt-2 text-lg font-semibold">{adjacentPosts.previous.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {adjacentPosts.previous.excerpt}
                    </p>
                    <p className="mt-3 text-xs text-neutral-500">
                      {adjacentPosts.previous.date} · {adjacentPosts.previous.readTime}
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 p-5 text-sm text-neutral-500 dark:border-white/10">
                    {t("firstPost")}
                  </div>
                )}

                {adjacentPosts.next ? (
                  <Link
                    href={`/posts/${adjacentPosts.next.slug}`}
                    className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("next")}</p>
                    <h3 className="mt-2 text-lg font-semibold">{adjacentPosts.next.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {adjacentPosts.next.excerpt}
                    </p>
                    <p className="mt-3 text-xs text-neutral-500">
                      {adjacentPosts.next.date} · {adjacentPosts.next.readTime}
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 p-5 text-sm text-neutral-500 dark:border-white/10">
                    {t("lastPost")}
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{t("snapshot")}</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-500">{t("category")}</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{post.frontmatter.category}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t("published")}</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{post.frontmatter.date}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t("stops")}</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{post.locations.length}</dd>
                </div>
              </dl>
            </div>

            {post.headings.length > 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{t("contents")}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {post.headings.map((h) => (
                    <li key={h.id} className={h.level === 3 ? "ml-3" : ""}>
                      <a href={`#${h.id}`} className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      </article>
    </main>
  );
}
