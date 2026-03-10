import Link from "next/link";

export default function GearsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        <Link href="/" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          Home
        </Link>
        <Link href="/about" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          About Us
        </Link>
        <Link href="/gears" className="rounded-full bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black">
          Gears
        </Link>
        <Link href="/#all-trips" className="rounded-full px-3 py-1.5 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
          All Trips
        </Link>
      </nav>

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">Gears</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          已创建两个装备清单 markdown，内容你稍后可以直接补充。
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
            <p className="font-semibold">露营装备</p>
            <p className="mt-2 font-mono text-sm text-neutral-700 dark:text-neutral-300">
              content/gears/camping-gear.md
            </p>
          </article>

          <article className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
            <p className="font-semibold">摄影装备</p>
            <p className="mt-2 font-mono text-sm text-neutral-700 dark:text-neutral-300">
              content/gears/photo-gear.md
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
