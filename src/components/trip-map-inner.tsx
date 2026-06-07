"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { TripLocation } from "@/types/posts";
import type { MapRouteTrack } from "@/types/maps";

type TripMapInnerProps = {
  locations: TripLocation[];
  fallbackImage: string;
  track?: MapRouteTrack;
};

type LatLngTuple = [number, number];
type GeoJsonGeometry = {
  type?: unknown;
  coordinates?: unknown;
  geometries?: unknown;
};
type GeoJsonFeature = {
  type?: unknown;
  geometry?: unknown;
  features?: unknown;
};
type LoadedTrack = {
  src: string;
  segments: LatLngTuple[][];
  error: boolean;
};
const EMPTY_TRACK_SEGMENTS: LatLngTuple[][] = [];

function FitLocations({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }

    map.fitBounds(points, {
      padding: [36, 36],
      maxZoom: 12,
    });
  }, [map, points]);

  return null;
}

function getCenter(points: LatLngTuple[]): LatLngTuple {
  if (points.length === 0) {
    return [20, 0];
  }

  if (points.length === 1) {
    return points[0];
  }

  const [latTotal, lngTotal] = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0],
  );

  return [latTotal / points.length, lngTotal / points.length];
}

function isCoordinate(value: unknown): value is [number, number, ...number[]] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function readLineString(coordinates: unknown): LatLngTuple[] {
  if (!Array.isArray(coordinates)) return [];

  return coordinates
    .filter(isCoordinate)
    .map(([lng, lat]) => [lat, lng] as LatLngTuple)
    .filter(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180);
}

function readGeoJsonGeometry(geometry: unknown): LatLngTuple[][] {
  if (!geometry || typeof geometry !== "object") return [];

  const value = geometry as GeoJsonGeometry;
  if (value.type === "LineString") {
    const segment = readLineString(value.coordinates);
    return segment.length >= 2 ? [segment] : [];
  }

  if (value.type === "MultiLineString" && Array.isArray(value.coordinates)) {
    return value.coordinates
      .map(readLineString)
      .filter((segment) => segment.length >= 2);
  }

  if (value.type === "GeometryCollection" && Array.isArray(value.geometries)) {
    return value.geometries.flatMap(readGeoJsonGeometry);
  }

  return [];
}

function readGeoJsonTrack(value: unknown): LatLngTuple[][] {
  if (!value || typeof value !== "object") return [];

  const geoJson = value as GeoJsonFeature;
  if (geoJson.type === "FeatureCollection" && Array.isArray(geoJson.features)) {
    return geoJson.features.flatMap(readGeoJsonTrack);
  }

  if (geoJson.type === "Feature") {
    return readGeoJsonGeometry(geoJson.geometry);
  }

  return readGeoJsonGeometry(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createPhotoMarkerIcon(imageUrl: string) {
  const safeImageUrl = escapeHtml(imageUrl);
  return L.divIcon({
    className: "",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
    html:
      `<span style="display:block;width:42px;height:42px;border-radius:9999px;overflow:hidden;border:2px solid #ffffff;box-shadow:0 6px 16px rgba(15,23,42,0.28);background:#e5e7eb;">` +
      `<img src="${safeImageUrl}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;" />` +
      `</span>`,
  });
}

export function TripMapInner({ locations, fallbackImage, track }: TripMapInnerProps) {
  const [loadedTrack, setLoadedTrack] = useState<LoadedTrack | null>(null);
  const trackSrc = track?.src;

  useEffect(() => {
    if (!trackSrc) {
      return;
    }

    let disposed = false;

    fetch(trackSrc)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Track request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((geoJson) => {
        if (disposed) return;

        const segments = readGeoJsonTrack(geoJson);
        setLoadedTrack({
          src: trackSrc,
          segments,
          error: segments.length === 0,
        });
      })
      .catch(() => {
        if (disposed) return;
        setLoadedTrack({
          src: trackSrc,
          segments: [],
          error: true,
        });
      });

    return () => {
      disposed = true;
    };
  }, [trackSrc]);

  const currentTrack = trackSrc && loadedTrack?.src === trackSrc ? loadedTrack : null;
  const trackSegments = currentTrack?.segments ?? EMPTY_TRACK_SEGMENTS;
  const trackStatus: "idle" | "loading" | "ready" | "error" = !trackSrc
    ? "idle"
    : !currentTrack
      ? "loading"
      : currentTrack.error
        ? "error"
        : "ready";

  const markerIcons = useMemo(
    () => locations.map((location) => createPhotoMarkerIcon(location.image ?? fallbackImage)),
    [locations, fallbackImage],
  );

  const points = useMemo<LatLngTuple[]>(
    () => locations.map((location) => [location.lat, location.lng]),
    [locations],
  );

  const center = useMemo(() => getCenter(points), [points]);
  const trackPoints = useMemo(() => trackSegments.flat(), [trackSegments]);
  const boundsPoints = useMemo(() => [...points, ...trackPoints], [points, trackPoints]);
  const trackPointCount = trackPoints.length;
  const trackColor = track?.color ?? "#f97316";
  const trackPathOptions = useMemo(
    () => ({
      color: trackColor,
      opacity: 0.9,
      weight: 5,
    }),
    [trackColor],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
      <MapContainer
        center={trackPoints.length > 0 ? getCenter(trackPoints) : center}
        zoom={boundsPoints.length > 1 ? 5 : 11}
        scrollWheelZoom={false}
        className="h-[22rem] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitLocations points={boundsPoints} />

        {trackSegments.map((segment, index) => (
          <Polyline
            key={`${track?.src ?? "track"}-${index}`}
            positions={segment}
            pathOptions={trackPathOptions}
          />
        ))}

        {locations.map((location, index) => (
          <Marker
            key={location.name + String(location.lat) + String(location.lng)}
            position={[location.lat, location.lng]}
            icon={markerIcons[index]}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{index + 1}. {location.name}</p>
                {location.note ? <p>{location.note}</p> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {track ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 bg-white px-4 py-3 text-xs text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
          <span>{track.title ?? "Route track"}</span>
          <span className="rounded-full border border-black/10 px-2 py-1 dark:border-white/10">
            {trackStatus === "ready"
              ? `GeoJSON · ${trackPointCount} points`
              : trackStatus === "error"
                ? "Track unavailable"
                : "Loading track"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
