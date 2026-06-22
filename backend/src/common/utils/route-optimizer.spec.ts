import {
  calculateRouteDistance,
  optimizeRoute,
  type RouteStop,
} from './route-optimizer';

describe('route optimizer', () => {
  const collectorBase = { latitude: -7.2575, longitude: 112.7521 };

  const stopA: RouteStop = {
    id: 'stop-a',
    latitude: -7.26,
    longitude: 112.75,
    estimated_weight_kg: 5,
    address: 'Stop A',
  };

  const stopB: RouteStop = {
    id: 'stop-b',
    latitude: -7.27,
    longitude: 112.76,
    estimated_weight_kg: 3,
    address: 'Stop B',
  };

  const stopC: RouteStop = {
    id: 'stop-c',
    latitude: -7.28,
    longitude: 112.77,
    estimated_weight_kg: 2,
    address: 'Stop C',
  };

  it('returns empty route for no stops', () => {
    const result = optimizeRoute(collectorBase, []);

    expect(result.orderedStops).toEqual([]);
    expect(result.distances).toEqual([]);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.estimatedDurationMinutes).toBe(0);
  });

  it('orders a single stop from collector base', () => {
    const result = optimizeRoute(collectorBase, [stopA]);

    expect(result.orderedStops).toEqual([stopA]);
    expect(result.distances).toHaveLength(1);
    expect(result.totalDistanceKm).toBe(result.distances[0]);
    expect(result.estimatedDurationMinutes).toBeGreaterThan(0);
  });

  it('picks the nearest stop first deterministically', () => {
    const result = optimizeRoute(collectorBase, [stopC, stopA, stopB]);

    expect(result.orderedStops[0].id).toBe('stop-a');
    expect(result.orderedStops.map((stop) => stop.id)).toEqual([
      'stop-a',
      'stop-b',
      'stop-c',
    ]);
  });

  it('returns one distance per stop', () => {
    const result = optimizeRoute(collectorBase, [stopA, stopB, stopC]);

    expect(result.distances).toHaveLength(result.orderedStops.length);
    expect(result.totalDistanceKm).toBeCloseTo(
      result.distances.reduce((sum, distance) => sum + distance, 0),
      6,
    );
  });

  it('calculates route distance without reordering stops', () => {
    const orderedStops = [stopA, stopC, stopB];
    const optimized = optimizeRoute(collectorBase, orderedStops);
    const fixed = calculateRouteDistance(collectorBase, orderedStops);

    expect(fixed.distances).toHaveLength(orderedStops.length);
    expect(fixed.totalDistanceKm).toBeCloseTo(
      fixed.distances.reduce((sum, distance) => sum + distance, 0),
      6,
    );
    expect(optimized.totalDistanceKm).toBeLessThanOrEqual(
      fixed.totalDistanceKm,
    );
  });

  it('returns a positive integer duration for multi-stop routes', () => {
    const result = optimizeRoute(collectorBase, [stopA, stopB, stopC]);

    expect(Number.isInteger(result.estimatedDurationMinutes)).toBe(true);
    expect(result.estimatedDurationMinutes).toBeGreaterThan(0);
  });

  it('produces a shorter route than a deliberately reversed order', () => {
    const stops = [stopA, stopB, stopC];
    const optimized = optimizeRoute(collectorBase, stops);
    const reversed = calculateRouteDistance(
      collectorBase,
      [...stops].reverse(),
    );

    expect(optimized.totalDistanceKm).toBeLessThanOrEqual(
      reversed.totalDistanceKm,
    );
  });
});
