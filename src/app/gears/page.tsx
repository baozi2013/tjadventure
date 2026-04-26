import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { SiteNav } from "@/components/site-nav";
import { mdxComponents } from "@/components/mdx-components";
import { createPageMetadata } from "@/lib/metadata";

const GEARS_DIR = path.join(process.cwd(), "content/gears");

export const metadata: Metadata = createPageMetadata({
  title: "Gears",
  description: "See the camping, photo, and road-trip gear TJ Adventure actually uses on family trips.",
  pathname: "/gears",
  image: "/gears/sonya6300.jpeg",
  keywords: ["travel gear", "camping gear", "camera gear", "family trip packing"],
});

async function renderGearMarkdown(fileName: string) {
  const fullPath = path.join(GEARS_DIR, fileName);
  const source = fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, "utf8")
    : "# 内容缺失\n\n暂未找到该装备清单文件。";

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
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
      <SiteNav current="gears" />

      <section className="rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">Gears</h1>

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
