import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const allPosts = getAllPosts();
  const [featuredPost, ...posts] = allPosts;
  const categories = [
    "全部",
    ...Array.from(new Set(allPosts.map((post) => post.category.split(" · ")[0]))),
  ];

  if (!featuredPost) {
    return <main className="mx-auto max-w-4xl px-6 py-20">No posts yet.</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-black/10 pb-8 dark:border-white/10">
        <p className="text-xs tracking-[0.2em] text-neutral-500">TJ ADVENTURE</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          把旅行写成能重走的路线
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          一半攻略，一半故事。目标很简单：让你看完就能出发，而不是收藏吃灰。
        </p>
      </header>

      <section className="mb-12 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Link
          href={`/posts/${featuredPost.slug}`}
          className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950"
        >
          <div className="relative h-64 w-full overflow-hidden">
            <Image
              src={featuredPost.coverImage}
              alt={featuredPost.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 65vw"
              priority
            />
          </div>
          <div className="p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{featuredPost.category}</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{featuredPost.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {featuredPost.excerpt}
            </p>
            <p className="mt-4 text-xs text-neutral-500">
              {featuredPost.date} · {featuredPost.readTime}
            </p>
          </div>
        </Link>

        <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-950">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">分类</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <span
                key={item}
                className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-neutral-700 dark:border-white/15 dark:text-neutral-200"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
            <p className="text-sm font-medium">本周推荐</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              如果你只看一篇，就看 {featuredPost.title.split("｜")[0]}。短线高回报，风景密度非常离谱。
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h3 className="text-xl font-semibold">最新文章</h3>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
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
                  sizes="(max-width: 768px) 100vw, 50vw"
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
    </main>
  );
}
