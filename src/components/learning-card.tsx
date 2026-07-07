import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { LearningSummary } from "@/types/learning";

type LearningCardProps = {
  entry: LearningSummary;
  priority?: boolean;
};

export function LearningCard({ entry, priority = false }: LearningCardProps) {
  return (
    <Link
      href={`/learning/${entry.slug}`}
      className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-950"
    >
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={entry.coverImage}
          alt={entry.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          priority={priority}
        />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-wider text-neutral-500">{entry.date}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:underline">{entry.title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{entry.excerpt}</p>
        {entry.tags && entry.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs text-neutral-600 dark:border-white/15 dark:text-neutral-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
