import Link from "next/link";
import type { PostSummary } from "@/lib/posts";
import type { CyclingSummary } from "@/types/cycling";

type StoryRideSwitchProps = {
  current: "post" | "cycling";
  post: PostSummary | null;
  cyclingEntry: CyclingSummary | null;
  className?: string;
};

type SwitchItemProps = {
  label: string;
  title: string;
  meta: string;
  description: string;
  href: string;
  isCurrent: boolean;
  cta: string;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMeasurement(measurement: { value: number; unit: string; display?: string }) {
  return measurement.display ?? `${measurement.value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${measurement.unit}`;
}

function SwitchItem({
  label,
  title,
  meta,
  description,
  href,
  isCurrent,
  cta,
  className,
}: SwitchItemProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
          <h3 className="mt-2 text-lg font-semibold leading-snug">{title}</h3>
        </div>
        <span
          className={cx(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
            isCurrent
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
              : "border-black/10 text-neutral-600 dark:border-white/15 dark:text-neutral-300",
          )}
        >
          {isCurrent ? "当前页面" : cta}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{description}</p>
      <p className="mt-4 text-xs text-neutral-500">{meta}</p>
    </>
  );

  const itemClassName = cx(
    "block p-5 transition sm:p-6",
    isCurrent ? "bg-neutral-100/70 dark:bg-neutral-900/70" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60",
    className,
  );

  if (isCurrent) {
    return (
      <div aria-current="page" className={itemClassName}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={itemClassName}>
      {content}
    </Link>
  );
}

export function StoryRideSwitch({ current, post, cyclingEntry, className }: StoryRideSwitchProps) {
  if (!post || !cyclingEntry) return null;

  return (
    <section
      className={cx(
        "mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950",
        className,
      )}
      aria-labelledby="story-ride-switch-title"
    >
      <div className="border-b border-black/10 p-5 dark:border-white/10 sm:flex sm:items-end sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Trip Pair</p>
          <h2 id="story-ride-switch-title" className="mt-2 text-2xl font-semibold tracking-tight">
            同一趟旅程的两个视角
          </h2>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:mt-0 sm:text-right">
          在家庭游记和骑行记录之间切换：一个看完整行程、照片和陪伴，一个看路线、数据和 Strava 细节。
        </p>
      </div>

      <div className="grid sm:grid-cols-2">
        <SwitchItem
          label="家庭游记"
          title={post.title}
          meta={`${post.date} · ${post.readTime}`}
          description="完整行程、照片和家庭视角都在这里。"
          href={`/posts/${post.slug}`}
          isCurrent={current === "post"}
          cta="查看游记"
          className="border-b border-black/10 dark:border-white/10 sm:border-b-0 sm:border-r"
        />
        <SwitchItem
          label="骑行记录"
          title={cyclingEntry.title}
          meta={`${cyclingEntry.rideDate} · ${formatMeasurement(cyclingEntry.distance)} · ${cyclingEntry.movingTime}`}
          description="路线、距离、爬升和骑行当天的关键细节。"
          href={`/cycling/${cyclingEntry.slug}`}
          isCurrent={current === "cycling"}
          cta="查看 ride log"
        />
      </div>
    </section>
  );
}
