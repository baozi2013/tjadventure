import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

const GEARS_DIR = path.join(process.cwd(), "content/gears");

async function renderGearMarkdown(fileName: string) {
  const fullPath = path.join(GEARS_DIR, fileName);
  const source = fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, "utf8")
    : "# 内容缺失\n\n暂未找到该装备清单文件。";

  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return content;
}

export default async function GearsPage() {
  const campingContent = await renderGearMarkdown("camping-gear.md");
  const photoContent = await renderGearMarkdown("photo-gear.md");

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        <Link href="/" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          Home
        </Link>
        <Link href="/about" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          About Us
        </Link>
        <Link href="/gears" className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-neutral-900 shadow-sm dark:border-white/25 dark:bg-neutral-900 dark:text-white">
          Gears
        </Link>
        <Link href="/trips" className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-black/15 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800 dark:hover:text-white">
          All Trips
        </Link>
      </nav>

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">Gears</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          已根据当前素材补充了露营与摄影装备初版，你可以继续在对应 markdown 里增删。
        </p>

        <div className="mt-6 space-y-8">
          <article className="rounded-2xl border border-black/10 px-5 py-5 dark:border-white/10">
            <div className="mdx-content max-w-none">{campingContent}</div>
          </article>

          <article className="rounded-2xl border border-black/10 px-5 py-5 dark:border-white/10">
            <div className="mdx-content max-w-none">{photoContent}</div>
          </article>
        </div>
      </section>
    </main>
  );
}
