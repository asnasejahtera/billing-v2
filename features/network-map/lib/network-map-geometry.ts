import type { Coordinate } from "../types/network-map.types";

/*
 * =========================
 * DISTANCE METERS
 * =========================
 * Menghitung jarak dua koordinat dengan Haversine.
 */
export function distanceMeters(from: Coordinate, to: Coordinate) {
  const earthRadius = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/*
 * =========================
 * ROUTE LENGTH
 * =========================
 * Menjumlahkan seluruh segment pada polyline.
 */
export function calculateRouteLength(points: Coordinate[]) {
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    total += distanceMeters(points[index - 1], points[index]);
  }
  return total;
}

/*
 * =========================
 * FORMAT LENGTH
 * =========================
 */
export function formatLength(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters.toFixed(1)} m`;
}

/*
 * =========================
 * NEAREST ROUTE SEGMENT
 * =========================
 * Menentukan segment polyline terdekat dari titik klik.
 * Return 0 = source → WP1, 1 = WP1 → WP2, dst.
 */
export function findNearestSegmentIndex(path: Coordinate[], point: Coordinate) {
  if (path.length < 2) return 0;

  /* Konversi koordinat lokal ke pendekatan meter. */
  const referenceLat = (point.lat * Math.PI) / 180;
  const meterPerLat = 111_320;
  const meterPerLng = meterPerLat * Math.cos(referenceLat);
  const toLocal = (coordinate: Coordinate) => ({
    x: coordinate.lng * meterPerLng,
    y: coordinate.lat * meterPerLat,
  });

  const p = toLocal(point);
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  /* Cari projection terdekat pada setiap segment. */
  for (let index = 0; index < path.length - 1; index++) {
    const a = toLocal(path[index]);
    const b = toLocal(path[index + 1]);
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const apX = p.x - a.x;
    const apY = p.y - a.y;
    const lengthSquared = abX * abX + abY * abY;
    let t = lengthSquared === 0 ? 0 : (apX * abX + apY * abY) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const deltaX = p.x - (a.x + abX * t);
    const deltaY = p.y - (a.y + abY * t);
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

    if (distanceSquared < nearestDistance) {
      nearestDistance = distanceSquared;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

/*
 * =========================
 * ROUTE MIDPOINT
 * =========================
 * Mencari titik tengah berdasarkan panjang
 * aktual polyline, bukan sekadar index array.
 */
export function getRouteMidpoint(path: Coordinate[]): Coordinate | null {
  if (!path.length) return null;
  if (path.length === 1) return { ...path[0] };

  const totalLength = calculateRouteLength(path);
  if (totalLength === 0) return { ...path[0] };

  const targetDistance = totalLength / 2;
  let travelled = 0;

  for (let index = 1; index < path.length; index++) {
    const from = path[index - 1];
    const to = path[index];
    const segmentLength = distanceMeters(from, to);

    if (travelled + segmentLength >= targetDistance) {
      const remaining = targetDistance - travelled;
      const ratio = segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        lat: from.lat + (to.lat - from.lat) * ratio,
        lng: from.lng + (to.lng - from.lng) * ratio,
      };
    }
    travelled += segmentLength;
  }

  return { ...path[path.length - 1] };
}