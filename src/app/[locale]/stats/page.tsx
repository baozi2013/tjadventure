import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteNav } from "@/components/site-nav";
import { createPageMetadata } from "@/lib/metadata";
import { computeSiteStats } from "@/lib/stats";
import { resolveLocale, type LocaleParams } from "@/i18n/locale";

type PageProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Stats" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/stats",
    locale,
    keywords: ["travel stats", "cycling stats", "trip totals"],
  });
}

export default async function StatsPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Stats" });
  const stats = computeSiteStats(locale);
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  const cards = [
    { label: t("totalPosts"), value: numberFormat.format(stats.totalPosts) },
    { label: t("totalRegions"), value: numberFormat.format(stats.regions.length) },
    { label: t("totalCyclingRides"), value: numberFormat.format(stats.totalCyclingRides) },
    { label: t("totalDistance"), value: t("milesValue", { value: numberFormat.format(stats.totalDistanceMiles) }) },
    { label: t("totalElevation"), value: t("feetValue", { value: numberFormat.format(stats.totalElevationFeet) }) },
    { label: t("totalLearningEntries"), value: numberFormat.format(stats.totalLearningEntries) },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="stats" />

      <header className="mb-8 rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          {stats.firstYear ? t("intro", { year: stats.firstYear }) : t("introFallback")}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-950"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {stats.regions.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-950">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{t("regionsLabel")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.regions.map((region) => (
              <span
                key={region}
                className="rounded-full border border-black/10 px-3 py-1 text-sm text-neutral-700 dark:border-white/15 dark:text-neutral-200"
              >
                {region}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
