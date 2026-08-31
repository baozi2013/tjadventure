"use client";

import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { readGeoJsonTrack } from "@/lib/geojson-track";
import { buildElevationProfile, type ElevationProfilePoint } from "@/lib/elevation-profile";
import type { MapRouteTrack } from "@/types/maps";

type ElevationChartProps = {
  track: MapRouteTrack;
};

type LoadState = "loading" | "ready" | "empty" | "error";

const SERIES_COLOR = "#f97316";
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 52 };
const PLOT_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom;

function niceStep(range: number, targetTicks: number) {
  if (range <= 0) return 1;
  const roughStep = range / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10;
  return niceNormalized * magnitude;
}

function buildYTicks(minElevation: number, maxElevation: number) {
  const step = niceStep(maxElevation - minElevation, 4);
  const start = Math.floor(minElevation / step) * step;
  const end = Math.ceil(maxElevation / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Math.round(value));
  }
  return { ticks, start, end };
}

export function ElevationChart({ track }: ElevationChartProps) {
  const t = useTranslations("ElevationChart");
  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<ElevationProfilePoint[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let disposed = false;

    fetch(track.src)
      .then((response) => {
        if (!response.ok) throw new Error(`Track request failed: ${response.status}`);
        return response.json();
      })
      .then((geoJson) => {
        if (disposed) return;
        const segments = readGeoJsonTrack(geoJson);
        const points = segments.flat();
        const nextProfile = buildElevationProfile(points);
        setProfile(nextProfile);
        setState(nextProfile.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (disposed) return;
        setState("error");
      });

    return () => {
      disposed = true;
    };
  }, [track.src]);

  const stats = useMemo(() => {
    if (profile.length === 0) return null;

    const elevations = profile.map((point) => point.elevationFeet);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    let gain = 0;
    for (let i = 1; i < profile.length; i += 1) {
      const delta = profile[i].elevationFeet - profile[i - 1].elevationFeet;
      if (delta > 0) gain += delta;
    }
    const totalDistance = profile[profile.length - 1].distanceMiles;

    return { minElevation, maxElevation, gain, totalDistance };
  }, [profile]);

  const geometry = useMemo(() => {
    if (!stats || profile.length === 0) return null;

    const { minElevation, maxElevation } = stats;
    const { ticks, start, end } = buildYTicks(minElevation, maxElevation);
    const elevationRange = end - start || 1;
    const distanceRange = stats.totalDistance || 1;

    const points = profile.map((point) => {
      const x = PADDING.left + (point.distanceMiles / distanceRange) * PLOT_WIDTH;
      const y = PADDING.top + PLOT_HEIGHT - ((point.elevationFeet - start) / elevationRange) * PLOT_HEIGHT;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const baselineY = PADDING.top + PLOT_HEIGHT;
    const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baselineY} L${points[0].x.toFixed(1)},${baselineY} Z`;

    return { points, linePath, areaPath, ticks, start, end };
  }, [profile, stats]);

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!geometry || profile.length === 0) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    const distanceRatio = Math.min(1, Math.max(0, (relativeX - PADDING.left) / PLOT_WIDTH));
    const targetDistance = distanceRatio * (stats?.totalDistance ?? 0);

    let nearestIndex = 0;
    let nearestDelta = Infinity;
    for (let i = 0; i < profile.length; i += 1) {
      const delta = Math.abs(profile[i].distanceMiles - targetDistance);
      if (delta < nearestDelta) {
        nearestDelta = delta;
        nearestIndex = i;
      }
    }
    setHoverIndex(nearestIndex);
  }

  if (state === "loading") {
    return (
      <div className="flex h-[13.75rem] items-center justify-center rounded-2xl border border-black/10 bg-neutral-50 text-sm text-neutral-500 dark:border-white/10 dark:bg-neutral-900/50 dark:text-neutral-300">
        {t("loading")}
      </div>
    );
  }

  if (state !== "ready" || !geometry || !stats) {
    return null;
  }

  const hoverPoint = hoverIndex != null ? profile[hoverIndex] : null;
  const hoverGeometry = hoverIndex != null ? geometry.points[hoverIndex] : null;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">{t("title")}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {t("summary", {
              gain: Math.round(stats.gain).toLocaleString("en-US"),
              min: Math.round(stats.minElevation).toLocaleString("en-US"),
              max: Math.round(stats.maxElevation).toLocaleString("en-US"),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((value) => !value)}
          className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600 transition hover:bg-neutral-100 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {showTable ? t("hideTable") : t("showTable")}
        </button>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={t("summary", {
          gain: Math.round(stats.gain).toLocaleString("en-US"),
          min: Math.round(stats.minElevation).toLocaleString("en-US"),
          max: Math.round(stats.maxElevation).toLocaleString("en-US"),
        })}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {geometry.ticks.map((tick) => {
          const y = PADDING.top + PLOT_HEIGHT - ((tick - geometry.start) / (geometry.end - geometry.start || 1)) * PLOT_HEIGHT;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={VIEW_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="stroke-neutral-200 dark:stroke-neutral-800"
                strokeWidth={1}
              />
              <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-neutral-500 text-[10px]">
                {tick.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        <text x={PADDING.left} y={VIEW_HEIGHT - 6} textAnchor="start" className="fill-neutral-500 text-[10px]">
          0 mi
        </text>
        <text x={VIEW_WIDTH - PADDING.right} y={VIEW_HEIGHT - 6} textAnchor="end" className="fill-neutral-500 text-[10px]">
          {stats.totalDistance.toFixed(1)} mi
        </text>

        <path d={geometry.areaPath} fill={SERIES_COLOR} fillOpacity={0.1} stroke="none" />
        <path d={geometry.linePath} fill="none" stroke={SERIES_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hoverGeometry ? (
          <g>
            <line
              x1={hoverGeometry.x}
              x2={hoverGeometry.x}
              y1={PADDING.top}
              y2={PADDING.top + PLOT_HEIGHT}
              className="stroke-neutral-400 dark:stroke-neutral-600"
              strokeWidth={1}
            />
            <circle cx={hoverGeometry.x} cy={hoverGeometry.y} r={4} fill={SERIES_COLOR} stroke="white" strokeWidth={2} />
          </g>
        ) : null}
      </svg>

      {hoverPoint ? (
        <div className="mt-2 inline-flex gap-4 rounded-lg border border-black/10 bg-neutral-50 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-neutral-900">
          <span className="text-neutral-500">{t("distanceLabel")}</span>
          <span className="font-medium text-neutral-900 dark:text-white">{hoverPoint.distanceMiles.toFixed(1)} mi</span>
          <span className="text-neutral-500">{t("elevationLabel")}</span>
          <span className="font-medium text-neutral-900 dark:text-white">
            {Math.round(hoverPoint.elevationFeet).toLocaleString("en-US")} ft
          </span>
        </div>
      ) : null}

      {showTable ? (
        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 font-medium text-neutral-500">{t("distanceLabel")}</th>
                <th className="px-3 py-2 font-medium text-neutral-500">{t("elevationLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {profile.map((point) => (
                <tr key={point.distanceMiles} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-3 py-1.5 text-neutral-700 dark:text-neutral-300">{point.distanceMiles.toFixed(2)} mi</td>
                  <td className="px-3 py-1.5 text-neutral-700 dark:text-neutral-300">
                    {Math.round(point.elevationFeet).toLocaleString("en-US")} ft
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
