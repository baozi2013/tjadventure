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

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>
        <p className="mt-4 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          四口幸福之家，爱旅游，爱拍照，爱运动。
        </p>

        <div className="mt-8 space-y-7">
          <article>
            <h2 className="text-xl font-semibold">Tian 天</h2>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              负责把行程和后勤安排得明明白白，爱拍美女和美景。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              导游，计划精准，行程丰富，日常维护博客网站。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              拍摄设备：iPhone 17、GoPro 10、Sony a6300。
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold">Jane 静</h2>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              言情小说爱好者，只负责美丽。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              一家之主，两娃的辣妈，运动健将，lululemon 深度患者。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              拍摄设备：iPhone 16 Pro、佳能单反、徕卡相机。
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold">William 大宝</h2>
          </article>

          <article>
            <h2 className="text-xl font-semibold">George 二宝</h2>
          </article>
        </div>
      </section>
    </main>
  );
}
