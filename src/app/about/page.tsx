import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        <Link href="/" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          Home
        </Link>
        <Link href="/about" className="rounded-full bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black">
          About Us
        </Link>
        <Link href="/gears" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          Gears
        </Link>
        <Link href="/#all-trips" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          All Trips
        </Link>
      </nav>

      <header className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>
        <p className="mt-4 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          TJ Adventure 记录家庭旅行、公路自驾和国家公园探索。我们更关注可复用的真实经验：
          什么时候去、路线怎么走、哪些点值得、哪些地方要避雷。
        </p>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          如果你喜欢“看完就能出发”的游记，这里就是为你准备的。
        </p>
      </header>
    </main>
  );
}
