import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const allPosts = getAllPosts();
  const seasonalHighlights = allPosts.slice(0, 3);
  const highlightSlugs = new Set(seasonalHighlights.map((post) => post.slug));
  const recentPosts = allPosts.filter((post) => !highlightSlugs.has(post.slug)).slice(0, 12);

  if (allPosts.length === 0) {
    return <main className="mx-auto max-w-4xl px-6 py-20">No posts yet.</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        <Link href="/" className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-neutral-900 shadow-sm dark:border-white/25 dark:bg-neutral-900 dark:text-white">
          Home
        </Link>
        <Link href="/about" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          About Us
        </Link>
        <Link href="/gears" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          Gears
        </Link>
        <Link href="/trips" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          All Trips
        </Link>
      </nav>

      <header className="mb-10 border-b border-black/10 pb-8 dark:border-white/10">
        <p className="text-xs tracking-[0.2em] text-neutral-500">TJ ADVENTURE</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          把旅行写成能重走的路线
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          一半攻略，一半故事。目标很简单：让你看完就能出发，而不是收藏吃灰。
        </p>
      </header>

      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between">
          <h3 className="text-xl font-semibold">Seasonal Highlights</h3>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seasonalHighlights.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-wider text-neutral-500">{post.category}</p>
                <h4 className="mt-2 text-lg font-semibold leading-snug group-hover:underline">
                  {post.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {post.excerpt}
                </p>
                <p className="mt-3 text-xs text-neutral-500">
                  {post.date} · {post.readTime}
                </p>
              </div>
            </Link>
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
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">{post.category}</p>
                  <h4 className="mt-2 text-lg font-semibold leading-snug group-hover:underline">
                    {post.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {post.excerpt}
                  </p>
                  <p className="mt-3 text-xs text-neutral-500">
                    {post.date} · {post.readTime}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
