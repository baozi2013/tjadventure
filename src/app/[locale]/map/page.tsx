import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteNav } from "@/components/site-nav";
import { WorldMap } from "@/components/world-map";
import { createPageMetadata } from "@/lib/metadata";
import { getWorldMapPins } from "@/lib/map-pins";
import { resolveLocale, type LocaleParams } from "@/i18n/locale";

type PageProps = {
  params: LocaleParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Map" });

  return createPageMetadata({
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    pathname: "/map",
    locale,
    keywords: ["travel map", "trip map", "everywhere we've been", "cycling map"],
  });
}

export default async function MapPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Map" });
  const pins = getWorldMapPins(locale);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <SiteNav current="map" />

      <header className="mb-8 rounded-3xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-neutral-950">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-base leading-8 text-neutral-700 dark:text-neutral-300">
          {pins.length > 0 ? t("intro", { count: pins.length }) : t("empty")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#2563eb" }} />
            {t("legendPosts")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#f97316" }} />
            {t("legendCycling")}
          </span>
        </div>
      </header>

      {pins.length > 0 ? <WorldMap pins={pins} /> : null}
    </main>
  );
}
