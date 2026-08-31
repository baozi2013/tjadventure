import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/posts";
import { splitByHighlightRanges, type HighlightRange } from "@/lib/text-highlight";

export type PostCardPost = Pick<
  PostSummary,
  "slug" | "title" | "coverImage" | "category" | "excerpt" | "date" | "readTime"
> & {
  href?: string;
};

type PostCardProps = {
  post: PostCardPost;
  priority?: boolean;
  size?: "default" | "feature";
  titleHighlight?: HighlightRange[];
  excerptHighlight?: HighlightRange[];
};

function HighlightedText({ text, ranges }: { text: string; ranges?: HighlightRange[] }) {
  const segments = splitByHighlightRanges(text, ranges);

  return (
    <>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <mark key={index} className="rounded bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-500/30">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

export function PostCard({ post, priority = false, size = "default", titleHighlight, excerptHighlight }: PostCardProps) {
  const imageHeightClassName = size === "feature" ? "h-52" : "h-44";

  return (
    <Link
      href={post.href ?? `/posts/${post.slug}`}
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
          <HighlightedText text={post.title} ranges={titleHighlight} />
        </h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          <HighlightedText text={post.excerpt} ranges={excerptHighlight} />
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          {post.date} · {post.readTime}
        </p>
      </div>
    </Link>
  );
}
