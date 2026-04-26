import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/lib/posts";

type PostCardProps = {
  post: PostSummary;
  priority?: boolean;
  size?: "default" | "feature";
};

export function PostCard({ post, priority = false, size = "default" }: PostCardProps) {
  const imageHeightClassName = size === "feature" ? "h-52" : "h-44";

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950"
    >
      <div className={`relative w-full overflow-hidden ${imageHeightClassName}`}>
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          priority={priority}
        />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-wider text-neutral-500">{post.category}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:underline">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {post.excerpt}
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          {post.date} · {post.readTime}
        </p>
      </div>
    </Link>
  );
}
