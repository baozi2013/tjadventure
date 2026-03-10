import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

type Params = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function PostDetail({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.content,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
        ],
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8 lg:px-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← 返回首页
      </Link>

      <article className="mt-5 grid gap-10 lg:grid-cols-[1fr_260px]">
        <div>
          <header className="mb-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              {post.frontmatter.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {post.frontmatter.title}
            </h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">{post.frontmatter.excerpt}</p>
            <p className="mt-3 text-xs text-neutral-500">
              {post.frontmatter.date} · {post.frontmatter.readTime}
            </p>
          </header>

          <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl sm:h-96">
            <Image
              src={post.frontmatter.coverImage}
              alt={post.frontmatter.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>

          <div className="mdx-content max-w-none">
            {content}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-950">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">目录</p>
            <ul className="mt-3 space-y-2 text-sm">
              {post.headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "ml-3" : ""}>
                  <a href={`#${h.id}`} className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </article>
    </main>
  );
}
