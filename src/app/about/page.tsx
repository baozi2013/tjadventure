import type { Metadata } from "next";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About Us",
  description: "Meet the TJ Adventure family behind the blog, the planning style, and the camera gear that documents each trip.",
  pathname: "/about",
  image: "/about/tian.png",
  keywords: ["about TJ Adventure", "family travel bloggers", "travel photography family"],
});

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="about" />

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>
        <p className="mt-4 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          四口幸福之家，爱旅游，爱拍照，爱运动。
        </p>

        <div className="mt-8 space-y-7">
          <article>
            <h2 className="text-xl font-semibold">Tian 天</h2>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              负责把行程和后勤安排得明明白白，爱拍美女和美景，骑行人。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              导游，计划精准，行程丰富，日常维护博客网站。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              拍摄设备：iPhone 17、GoPro 10、Sony a6300。
            </p>
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-96 dark:border-white/10">
              <Image
                src="/about/tian.png"
                alt="Tian 在 Lake Tahoe"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>

          <article>
            <h2 className="text-xl font-semibold">Jane 静</h2>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              言情小说爱好者，只负责美丽。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              一家之主，两娃的辣妈，运动健将，lululemon 深度患者，just dance 达人。
            </p>
            <p className="mt-2 text-base leading-8 text-neutral-700 dark:text-neutral-300">
              拍摄设备：iPhone 16 Pro。
            </p>
            <div className="relative mt-4 h-64 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-80 dark:border-white/10">
              <Image
                src="/trips/palm-spring-2025/day1-3.jpg"
                alt="Jane 在 Joshua Tree"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>

          <article>
            <h2 className="text-xl font-semibold">William 大宝 包子</h2>
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-96 dark:border-white/10">
              <Image
                src="/about/william.png"
                alt="William"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>

          <article>
            <h2 className="text-xl font-semibold">George 二宝 汤圆</h2>
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-2xl border border-black/10 sm:h-96 dark:border-white/10">
              <Image
                src="/about/george.png"
                alt="George"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 768px"
              />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
