import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  getAdjacentLearningEntries,
  getAllLearningEntries,
  getLearningEntryBySlug,
  getLearningLanguageAlternates,
} from "@/lib/learning";
import { mdxComponents } from "@/components/mdx-components";
import { createPageMetadata } from "@/lib/metadata";
import { SiteNav } from "@/components/site-nav";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/locale";

type Params = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllLearningEntries(locale).map((entry) => ({ locale, slug: entry.slug })),
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const t = await getTranslations({ locale, namespace: "LearningDetail" });
  const entry = getLearningEntryBySlug(slug, locale);

  if (!entry) {
    return createPageMetadata({
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
      pathname: `/learning/${slug}`,
      locale,
    });
  }

  return createPageMetadata({
    title: entry.title,
    description: entry.excerpt,
    pathname: `/learning/${slug}`,
    locale,
    languageAlternates: getLearningLanguageAlternates(entry.translationKey),
    image: entry.coverImage,
    keywords: entry.tags,
    type: "article",
    publishedTime: entry.date,
    section: "Learning",
    tags: entry.tags,
  });
}

export default async function LearningDetail({ params }: Params) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "LearningDetail" });
  const { slug } = await params;
  const entry = getLearningEntryBySlug(slug, locale);

  if (!entry) notFound();

  const adjacentEntries = getAdjacentLearningEntries(slug, locale);

  const { content } = await compileMDX({
    source: entry.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "append" }]],
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8 lg:px-10">
      <SiteNav current="learning" />

      <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
          {t("home")}
        </Link>
        <span>/</span>
        <Link href="/learning" className="hover:text-neutral-900 dark:hover:text-white">
          {t("learning")}
        </Link>
      </nav>

      <article className="mt-5 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <header className="mb-6 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-8">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{entry.title}</h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">{entry.excerpt}</p>
            <p className="mt-3 text-xs text-neutral-500">{entry.date}</p>
            {entry.tags && entry.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 transition hover:bg-neutral-100 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl sm:h-96">
            <Image
              src={entry.coverImage}
              alt={entry.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 860px"
              priority
            />
          </div>

          <div className="mdx-content max-w-none">{content}</div>

          {adjacentEntries.previous || adjacentEntries.next ? (
            <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("continueEyebrow")}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{t("continueTitle")}</h2>
                </div>
                <Link href="/learning" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                  {t("allEntries")}
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {adjacentEntries.previous ? (
                  <Link
                    href={`/learning/${adjacentEntries.previous.slug}`}
                    className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("previous")}</p>
                    <h3 className="mt-2 text-lg font-semibold">{adjacentEntries.previous.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {adjacentEntries.previous.excerpt}
                    </p>
                    <p className="mt-3 text-xs text-neutral-500">{adjacentEntries.previous.date}</p>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 p-5 text-sm text-neutral-500 dark:border-white/10">
                    {t("firstEntry")}
                  </div>
                )}

                {adjacentEntries.next ? (
                  <Link
                    href={`/learning/${adjacentEntries.next.slug}`}
                    className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("next")}</p>
                    <h3 className="mt-2 text-lg font-semibold">{adjacentEntries.next.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {adjacentEntries.next.excerpt}
                    </p>
                    <p className="mt-3 text-xs text-neutral-500">{adjacentEntries.next.date}</p>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 p-5 text-sm text-neutral-500 dark:border-white/10">
                    {t("lastEntry")}
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
                  <dt className="text-neutral-500">{t("published")}</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{entry.date}</dd>
                </div>
              </dl>
            </div>

            {entry.headings.length > 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{t("contents")}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {entry.headings.map((heading) => (
                    <li key={heading.id} className={heading.level === 3 ? "ml-3" : ""}>
                      <a
                        href={`#${heading.id}`}
                        className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
                      >
                        {heading.text}
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
