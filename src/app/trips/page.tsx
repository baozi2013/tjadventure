import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function TripsPage() {
  const allPosts = getAllPosts();
  const categories = [
    "全部",
    ...Array.from(new Set(allPosts.map((post) => post.category.split(" · ")[0]))),
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        <Link href="/" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          Home
        </Link>
        <Link href="/about" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          About Us
        </Link>
        <Link href="/gears" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          Gears
        </Link>
        <Link href="/trips" className="rounded-full bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black">
          All Trips
        </Link>
      </nav>

      <header className="mb-8 rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">All Trips</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          所有游记集合页，按日期从新到旧排序。
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-300">
          {categories.map((item) => (
            <span key={item} className="rounded-full border border-black/10 px-3 py-1 dark:border-white/15">
              {item}
            </span>
          ))}
        </div>
      </header>

      {allPosts.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">No posts yet.</p>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post) => (
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
                />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-wider text-neutral-500">{post.category}</p>
                <h2 className="mt-2 text-lg font-semibold leading-snug group-hover:underline">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {post.excerpt}
                </p>
                <p className="mt-3 text-xs text-neutral-500">
                  {post.date} · {post.readTime}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
