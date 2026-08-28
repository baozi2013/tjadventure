"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { WorldMapPin } from "@/types/maps";

type WorldMapInnerProps = {
  pins: WorldMapPin[];
};

type LatLngTuple = [number, number];

function FitPins({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 9, { animate: false });
      return;
    }

    map.fitBounds(points, {
      animate: false,
      padding: [36, 36],
      maxZoom: 10,
    });
  }, [map, points]);

  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PIN_BORDER_COLOR: Record<WorldMapPin["kind"], string> = {
  post: "#2563eb",
  cycling: "#f97316",
};

function createPinIcon(imageUrl: string, kind: WorldMapPin["kind"]) {
  const safeImageUrl = escapeHtml(imageUrl);
  const borderColor = PIN_BORDER_COLOR[kind];

  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
    html:
      `<span style="display:block;width:38px;height:38px;border-radius:9999px;overflow:hidden;border:2px solid ${borderColor};box-shadow:0 6px 16px rgba(15,23,42,0.28);background:#e5e7eb;">` +
      `<img src="${safeImageUrl}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;" />` +
      `</span>`,
  });
}

export function WorldMapInner({ pins }: WorldMapInnerProps) {
  const t = useTranslations("Map");
  const points = useMemo<LatLngTuple[]>(() => pins.map((pin) => [pin.lat, pin.lng]), [pins]);
  const icons = useMemo(() => pins.map((pin) => createPinIcon(pin.image, pin.kind)), [pins]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        zoomAnimation={false}
        scrollWheelZoom={false}
        className="h-[36rem] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitPins points={points} />

        {pins.map((pin, index) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icons[index]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{pin.title}</p>
                <p className="text-neutral-500">{pin.subtitle}</p>
                <Link href={pin.href} className="mt-1 inline-block underline">
                  {t("viewDetails")}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
