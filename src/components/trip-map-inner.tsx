"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { TripLocation } from "@/types/posts";

const DEFAULT_MARKER_ICON = L.icon({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DEFAULT_MARKER_ICON;

type TripMapInnerProps = {
  locations: TripLocation[];
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

export function TripMapInner({ locations }: TripMapInnerProps) {
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

        {points.length > 1 ? (
          <Polyline positions={points} pathOptions={{ color: "#2563eb", weight: 3, opacity: 0.75 }} />
        ) : null}

        {locations.map((location, index) => (
          <Marker key={location.name + String(location.lat) + String(location.lng)} position={[location.lat, location.lng]}>
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
