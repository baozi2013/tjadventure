import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

const MENU_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Gears", href: "#gears" },
  { label: "All Trips", href: "#all-trips" },
];

export default function Home() {
  const allPosts = getAllPosts();
  const [featuredPost] = allPosts;
  const categories = Array.from(new Set(allPosts.map((post) => post.category.split(" · ")[0])));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-24 pt-8 sm:px-8 lg:px-10">
      <nav className="mb-10 flex flex-col gap-4 rounded-full border border-black/10 bg-white/75 px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-black/10">
            <Image src="/icon.png" alt="TJ Adventure" fill className="object-cover" sizes="32px" priority />
          </div>
          <p className="text-sm font-semibold tracking-wide text-[#153d59]">TJ Adventure</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#153d59]">
          {MENU_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-[#153d59] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section
        id="home"
        className="mb-14 rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex items-end gap-5">
            <div className="relative h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-md sm:h-60 sm:w-60">
              <Image
                src="/icon.png"
                alt="TJ Adventure portrait"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 176px, 240px"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-[#f5ad35] py-1 text-center text-3xl font-bold tracking-wide text-white sm:text-5xl">
                TJ
              </div>
            </div>

            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md sm:h-36 sm:w-36">
              <Image
                src="/icon.png"
                alt="TJ Adventure mini logo"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 144px"
              />
            </div>
          </div>

          <div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-[#153d59] sm:text-7xl">
              TJ Adventure
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#153d59]/80 sm:text-lg">
              家庭旅行、公路自驾、国家公园与摄影记录。我们把每次旅程写成可复用路线，
              你可以直接照着走，也可以挑一段改成自己的版本。
            </p>

            {featuredPost ? (
              <Link
                href={`/posts/${featuredPost.slug}`}
                className="mt-6 inline-flex items-center rounded-full bg-[#153d59] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2e44]"
              >
                先看最新游记：{featuredPost.title.split("｜")[0]}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section id="about" className="mb-10 rounded-3xl border border-black/10 bg-white/75 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-[#153d59]">About Us</h2>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[#153d59]/80">
          我们是一家人+朋友团的长期旅行记录项目，主要关注美国国家公园、公路旅行和亲子友好玩法。
          每篇文章都会保留真实体验：哪些点值得、哪些餐馆踩雷、哪些时间段最省心。
        </p>
      </section>

      <section id="gears" className="mb-10 rounded-3xl border border-black/10 bg-white/75 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-[#153d59]">Gears</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-white px-4 py-4">
            <p className="font-semibold text-[#153d59]">Tesla + FSD</p>
            <p className="mt-2 text-sm leading-7 text-[#153d59]/75">长途自驾主力，路线规划和疲劳管理体验稳定。</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-white px-4 py-4">
            <p className="font-semibold text-[#153d59]">Seestar S30</p>
            <p className="mt-2 text-sm leading-7 text-[#153d59]/75">深空与月亮拍摄轻量设备，适合旅行快速架设。</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-white px-4 py-4">
            <p className="font-semibold text-[#153d59]">Travel Photo Kit</p>
            <p className="mt-2 text-sm leading-7 text-[#153d59]/75">手机+轻量镜头组合，优先保证机动性和出片率。</p>
          </article>
        </div>
      </section>

      <section id="all-trips" className="rounded-3xl border border-black/10 bg-white/75 p-6 sm:p-8">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-[#153d59]">All Trips</h2>
          <div className="flex flex-wrap gap-2 text-xs text-[#153d59]/80">
            {categories.map((item) => (
              <span key={item} className="rounded-full border border-black/10 px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>

        {allPosts.length === 0 ? (
          <p className="text-sm text-[#153d59]/75">No posts yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {allPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-[#153d59]/70">{post.category}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-[#153d59] group-hover:underline">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#153d59]/75">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-[#153d59]/65">
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
