export const MAP_TRACK_FORMATS = ["geojson"] as const;

export type MapTrackFormat = (typeof MAP_TRACK_FORMATS)[number];

export type MapRouteTrack = {
  src: string;
  format: MapTrackFormat;
  title?: string;
  color?: string;
};

export type TripLocation = {
  name: string;
  lat: number;
  lng: number;
  note?: string;
  image?: string;
};

export type WorldMapPinKind = "post" | "cycling";

export type WorldMapPin = {
  id: string;
  kind: WorldMapPinKind;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  href: string;
  image: string;
};
