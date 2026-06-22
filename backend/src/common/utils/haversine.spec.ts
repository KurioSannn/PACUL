import {
  calculateTotalDistance,
  findNearestPoint,
  haversineDistance,
  toRadians,
} from './haversine';

describe('haversine utilities', () => {
  const surabaya = { latitude: -7.2575, longitude: 112.7521 };
  // Straight-line haversine for Surabaya–Malang road corridor is ~90km at this offset.
  const malang = { latitude: -8.0655, longitude: 112.7521 };
  const jakarta = { latitude: -6.2088, longitude: 106.8456 };

  it('converts 180 degrees to pi radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 10);
  });

  it('converts 90 degrees to half pi radians', () => {
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('returns zero distance for the same point', () => {
    expect(haversineDistance(surabaya, surabaya)).toBeCloseTo(0, 6);
  });

  it('calculates Surabaya to Malang around 90km', () => {
    const distance = haversineDistance(surabaya, malang);

    expect(distance).toBeGreaterThanOrEqual(85);
    expect(distance).toBeLessThanOrEqual(95);
  });

  it('is symmetric between two points', () => {
    const forward = haversineDistance(surabaya, malang);
    const reverse = haversineDistance(malang, surabaya);

    expect(forward).toBeCloseTo(reverse, 10);
  });

  it('sums segment distances for three stops', () => {
    const stops = [surabaya, malang, jakarta];
    const total = calculateTotalDistance(stops);
    const expected =
      haversineDistance(surabaya, malang) + haversineDistance(malang, jakarta);

    expect(total).toBeCloseTo(expected, 6);
  });

  it('returns zero total distance for fewer than two stops', () => {
    expect(calculateTotalDistance([])).toBe(0);
    expect(calculateTotalDistance([surabaya])).toBe(0);
  });

  it('finds the nearest candidate point', () => {
    const result = findNearestPoint(surabaya, [
      { id: 'malang', ...malang },
      { id: 'jakarta', ...jakarta },
    ]);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('malang');
    expect(result?.distance).toBeCloseTo(
      haversineDistance(surabaya, malang),
      6,
    );
  });

  it('returns null when no candidates are provided', () => {
    expect(findNearestPoint(surabaya, [])).toBeNull();
  });

  it('finds nearest among multiple candidates in linear scan', () => {
    const midpoint = {
      latitude: (surabaya.latitude + malang.latitude) / 2,
      longitude: (surabaya.longitude + malang.longitude) / 2,
    };

    const result = findNearestPoint(surabaya, [
      { id: 'jakarta', ...jakarta },
      { id: 'midpoint', ...midpoint },
      { id: 'malang', ...malang },
    ]);

    expect(result?.id).toBe('midpoint');
    expect(result?.distance).toBeLessThan(haversineDistance(surabaya, malang));
  });
});
