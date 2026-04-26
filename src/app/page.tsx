import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  const allPosts = getAllPosts();
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
    return <main className="mx-auto max-w-4xl px-6 py-20">No posts yet.</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="home" />

      <header className="mb-10 overflow-hidden rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-9">
        <p className="text-xs tracking-[0.2em] text-neutral-500">TJ ADVENTURE</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          把旅行写成能重走的路线
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          一半攻略，一半故事。目标很简单：让你看完就能出发，而不是收藏吃灰。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/trips"
            className="rounded-full border border-black/15 bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:border-white/20 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            浏览全部游记
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            了解我们怎么旅行
          </Link>
        </div>
        <div className="mt-8 grid gap-3 border-t border-black/10 pt-6 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-300 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Reader Path</p>
            <p className="mt-2">先看亮点，再筛选目的地，最后进入单篇路线细读。</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Coverage</p>
            <p className="mt-2">{allPosts.length} 篇文章，覆盖 {regions.join(" / ")} 等地区。</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Publishing</p>
            <p className="mt-2">所有文章都走统一 frontmatter 校验，方便持续更新和重构。</p>
          </div>
        </div>
      </header>

      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between">
          <h3 className="text-xl font-semibold">Seasonal Highlights</h3>
          <p className="text-sm text-neutral-500">当前最值得先点开的 3 篇。</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seasonalHighlights.map((post, index) => (
            <PostCard key={post.slug} post={post} priority={index === 0} size="feature" />
          ))}
        </div>
      </section>

      <section id="all-trips">
        <div className="mb-5 flex items-end justify-between">
          <h3 className="text-xl font-semibold">Recent Posts</h3>
          <Link href="/trips" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            查看全部
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <p className="rounded-2xl border border-black/10 bg-white px-5 py-6 text-sm text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
            更多游记正在路上。
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
