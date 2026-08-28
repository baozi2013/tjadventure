"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { WorldMapPin } from "@/types/maps";

function WorldMapLoading() {
  const t = useTranslations("Map");

  return (
    <div className="flex h-[36rem] items-center justify-center rounded-2xl border border-black/10 bg-neutral-50 text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50 dark:text-neutral-300">
      {t("loading")}
    </div>
  );
}

const WorldMapInner = dynamic(
  () => import("@/components/world-map-inner").then((module) => module.WorldMapInner),
  {
    ssr: false,
    loading: () => <WorldMapLoading />,
  },
);

type WorldMapProps = {
  pins: WorldMapPin[];
};

export function WorldMap({ pins }: WorldMapProps) {
  return <WorldMapInner pins={pins} />;
}
