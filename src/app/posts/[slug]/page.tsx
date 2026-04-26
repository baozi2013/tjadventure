import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAdjacentPosts, getAllPosts, getPostBySlug } from "@/lib/posts";
import { mdxComponents } from "@/components/mdx-components";
import { TripMap } from "@/components/trip-map";
import { createPageMetadata } from "@/lib/metadata";

type Params = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return createPageMetadata({
      title: "Post Not Found",
      description: "The requested trip story could not be found.",
      pathname: `/posts/${slug}`,
    });
  }

  return createPageMetadata({
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    pathname: `/posts/${slug}`,
    image: post.frontmatter.coverImage,
    keywords: post.frontmatter.tags,
    type: "article",
    publishedTime: post.frontmatter.date,
    section: post.frontmatter.category,
    tags: post.frontmatter.tags,
  });
}

export default async function PostDetail({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const adjacentPosts = getAdjacentPosts(slug);
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
      <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">Home</Link>
        <span>/</span>
        <Link href="/trips" className="hover:text-neutral-900 dark:hover:text-white">Trips</Link>
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
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Region</p>
              <p className="mt-2 font-medium">{region}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Reading Time</p>
              <p className="mt-2 font-medium">{post.frontmatter.readTime}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Map Stops</p>
              <p className="mt-2 font-medium">{post.locations.length} 个点位</p>
            </div>
          </section>

          <div className="mdx-content max-w-none">
            {content}
          </div>

          {(adjacentPosts.previous || adjacentPosts.next) ? (
            <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Continue Reading</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">上一篇 / 下一篇</h2>
                </div>
                <Link href="/trips" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                  查看全部游记
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {adjacentPosts.previous ? (
                  <Link
                    href={`/posts/${adjacentPosts.previous.slug}`}
                    className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">上一篇</p>
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
                    已经是第一篇了。
                  </div>
                )}

                {adjacentPosts.next ? (
                  <Link
                    href={`/posts/${adjacentPosts.next.slug}`}
                    className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">下一篇</p>
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
                    已经是最后一篇了。
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Trip Snapshot</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Category</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{post.frontmatter.category}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Published</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{post.frontmatter.date}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Stops</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-white">{post.locations.length}</dd>
                </div>
              </dl>
            </div>

            {post.headings.length > 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">目录</p>
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
