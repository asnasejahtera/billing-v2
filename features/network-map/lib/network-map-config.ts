import type { Coordinate } from "../types/network-map.types";

/*
 * =========================
 * ENV NUMBER HELPER
 * =========================
 * Membaca numeric env dengan fallback.
 */
function getNumberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/*
 * =========================
 * DEFAULT MAP CAMERA
 * =========================
 */
export const DEFAULT_CENTER: Coordinate = {
  lat: getNumberEnv(process.env.NEXT_PUBLIC_GOOGLE_MAPS_DEFAULT_LAT, -7.6672),
  lng: getNumberEnv(process.env.NEXT_PUBLIC_GOOGLE_MAPS_DEFAULT_LNG, 111.5881),
};
export const DEFAULT_ZOOM = getNumberEnv(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_DEFAULT_ZOOM,
  19,
);

/*
 * =========================
 * GOOGLE MAP OPTIONS
 * =========================
 * Central configuration untuk map utama.
 */
export function createNetworkMapOptions(mapId: string) {
  return {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    mapId,
    mapTypeId: "hybrid",
    clickableIcons: false,
    mapTypeControl: true,
    zoomControl: true,
    fullscreenControl: true,
    streetViewControl: false,
    gestureHandling: "greedy",
    mapTypeControlOptions: {
      mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain"],
    },
  };
}