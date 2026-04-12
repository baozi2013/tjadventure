"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { TripLocation } from "@/types/posts";

type TripMapInnerProps = {
  locations: TripLocation[];
  fallbackImage: string;
};

type LatLngTuple = [number, number];

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

export function TripMapInner({ locations, fallbackImage }: TripMapInnerProps) {
  const markerIcons = useMemo(
    () => locations.map((location) => createPhotoMarkerIcon(location.image ?? fallbackImage)),
    [locations, fallbackImage],
  );

  const points = useMemo<LatLngTuple[]>(
    () => locations.map((location) => [location.lat, location.lng]),
    [locations],
  );

  const center = useMemo(() => getCenter(points), [points]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
      <MapContainer
        center={center}
        zoom={points.length > 1 ? 5 : 11}
        scrollWheelZoom={false}
        className="h-[22rem] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitLocations points={points} />

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
    </div>
  );
}
