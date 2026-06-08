import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  currentLabel: string;
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
  currentLabel,
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
          {isCurrent ? currentLabel : cta}
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
  const t = useTranslations("StoryRideSwitch");

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
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("eyebrow")}</p>
          <h2 id="story-ride-switch-title" className="mt-2 text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:mt-0 sm:text-right">
          {t("intro")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2">
        <SwitchItem
          label={t("storyLabel")}
          title={post.title}
          meta={`${post.date} · ${post.readTime}`}
          description={t("storyDescription")}
          href={`/posts/${post.slug}`}
          isCurrent={current === "post"}
          cta={t("storyCta")}
          currentLabel={t("currentPage")}
          className="border-b border-black/10 dark:border-white/10 sm:border-b-0 sm:border-r"
        />
        <SwitchItem
          label={t("rideLabel")}
          title={cyclingEntry.title}
          meta={`${cyclingEntry.rideDate} · ${formatMeasurement(cyclingEntry.distance)} · ${cyclingEntry.movingTime}`}
          description={t("rideDescription")}
          href={`/cycling/${cyclingEntry.slug}`}
          isCurrent={current === "cycling"}
          cta={t("rideCta")}
          currentLabel={t("currentPage")}
        />
      </div>
    </section>
  );
}
