export type TrackPoint = {
  lat: number;
  lng: number;
  elevationMeters?: number;
};

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

function readLineString(coordinates: unknown): TrackPoint[] {
  if (!Array.isArray(coordinates)) return [];

  return coordinates
    .filter(isCoordinate)
    .map(([lng, lat, elevationMeters]) => ({ lat, lng, elevationMeters }))
    .filter(({ lat, lng }) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180);
}

function readGeoJsonGeometry(geometry: unknown): TrackPoint[][] {
  if (!geometry || typeof geometry !== "object") return [];

  const value = geometry as GeoJsonGeometry;
  if (value.type === "LineString") {
    const segment = readLineString(value.coordinates);
    return segment.length >= 2 ? [segment] : [];
  }

  if (value.type === "MultiLineString" && Array.isArray(value.coordinates)) {
    return value.coordinates.map(readLineString).filter((segment) => segment.length >= 2);
  }

  if (value.type === "GeometryCollection" && Array.isArray(value.geometries)) {
    return value.geometries.flatMap(readGeoJsonGeometry);
  }

  return [];
}

export function readGeoJsonTrack(value: unknown): TrackPoint[][] {
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
