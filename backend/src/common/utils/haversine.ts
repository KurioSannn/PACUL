export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NearestPointResult {
  id: string;
  distance: number;
}

const EARTH_RADIUS_KM = 6371;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const fromLatitudeRadians = toRadians(from.latitude);
  const toLatitudeRadians = toRadians(to.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(deltaLongitude / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function calculateTotalDistance(stops: Coordinates[]): number {
  if (stops.length < 2) {
    return 0;
  }

  let total = 0;

  for (let index = 1; index < stops.length; index += 1) {
    total += haversineDistance(stops[index - 1], stops[index]);
  }

  return total;
}

export function findNearestPoint(
  from: Coordinates,
  candidates: Array<Coordinates & { id: string }>,
): NearestPointResult | null {
  if (candidates.length === 0) {
    return null;
  }

  let nearest = candidates[0];
  let nearestDistance = haversineDistance(from, nearest);

  for (let index = 1; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const distance = haversineDistance(from, candidate);

    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return {
    id: nearest.id,
    distance: nearestDistance,
  };
}
