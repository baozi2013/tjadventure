"use client";

import dynamic from "next/dynamic";
import type { TripLocation } from "@/types/posts";

const TripMapInner = dynamic(
  () => import("@/components/trip-map-inner").then((module) => module.TripMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[22rem] items-center justify-center rounded-2xl border border-black/10 bg-neutral-50 text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50 dark:text-neutral-300">
        地图加载中...
      </div>
    ),
  },
);

type TripMapProps = {
  title: string;
  locations: TripLocation[];
};

export function TripMap({ title, locations }: TripMapProps) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">行程地图</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {title} · 共 {locations.length} 个点位
          </p>
        </div>
      </div>

      <TripMapInner locations={locations} />

      <ol className="mt-4 grid gap-2 text-sm text-neutral-700 dark:text-neutral-200 sm:grid-cols-2">
        {locations.map((location, index) => (
          <li
            key={`${location.name}-${location.lat}-${location.lng}`}
            className="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-neutral-900/50"
          >
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {index + 1}. {location.name}
            </p>
            {location.note ? (
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{location.note}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
