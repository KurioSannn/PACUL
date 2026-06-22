import { haversineDistance, type Coordinates } from './haversine';

export interface RouteStop {
  id: string;
  latitude: number;
  longitude: number;
  estimated_weight_kg: number;
  address: string | null;
}

export interface OptimizedRoute {
  orderedStops: RouteStop[];
  distances: number[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
}

export interface RouteDistanceResult {
  distances: number[];
  totalDistanceKm: number;
}

export function optimizeRoute(
  collectorBase: Coordinates,
  stops: RouteStop[],
): OptimizedRoute {
  if (stops.length === 0) {
    return {
      orderedStops: [],
      distances: [],
      totalDistanceKm: 0,
      estimatedDurationMinutes: 0,
    };
  }

  const remaining = [...stops];
  const orderedStops: RouteStop[] = [];
  const distances: number[] = [];
  let current: Coordinates = collectorBase;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = haversineDistance(current, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = haversineDistance(current, remaining[index]);

      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    }

    const [nextStop] = remaining.splice(nearestIndex, 1);
    orderedStops.push(nextStop);
    distances.push(roundDistanceKm(nearestDistance));
    current = nextStop;
  }

  const totalDistanceKm = roundDistanceKm(
    distances.reduce((sum, distance) => sum + distance, 0),
  );

  return {
    orderedStops,
    distances,
    totalDistanceKm,
    estimatedDurationMinutes: estimateDurationMinutes(
      totalDistanceKm,
      orderedStops.length,
    ),
  };
}

export function calculateRouteDistance(
  collectorBase: Coordinates,
  orderedStops: RouteStop[],
): RouteDistanceResult {
  if (orderedStops.length === 0) {
    return {
      distances: [],
      totalDistanceKm: 0,
    };
  }

  const distances: number[] = [];
  let current: Coordinates = collectorBase;

  for (const stop of orderedStops) {
    const distance = haversineDistance(current, stop);
    distances.push(roundDistanceKm(distance));
    current = stop;
  }

  return {
    distances,
    totalDistanceKm: roundDistanceKm(
      distances.reduce((sum, distance) => sum + distance, 0),
    ),
  };
}

function estimateDurationMinutes(
  totalDistanceKm: number,
  stopCount: number,
): number {
  return Math.round(totalDistanceKm * 3 + stopCount * 10);
}

function roundDistanceKm(distanceKm: number): number {
  return Math.round(distanceKm * 1000) / 1000;
}
