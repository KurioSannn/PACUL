const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const latARad = toRadians(latitudeA);
  const latBRad = toRadians(latitudeB);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latARad) * Math.cos(latBRad) * Math.sin(deltaLongitude / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}
