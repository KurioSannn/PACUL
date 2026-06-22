import { WASTE_AI_TAXONOMY } from '../../modules/ai/ai.taxonomy';
import {
  EMISSION_FACTORS,
  estimateCo2SavedKg,
  getEmissionFactor,
} from './emission-factors';

describe('estimateCo2SavedKg', () => {
  it('applies the PET factor to a single-category weight', () => {
    const result = estimateCo2SavedKg(new Map([['PLASTIC_PET', 10]]));
    expect(result).toBeCloseTo(10 * EMISSION_FACTORS.PLASTIC_PET);
  });

  it('applies the METAL_CAN factor to a single-category weight', () => {
    const result = estimateCo2SavedKg(new Map([['METAL_CAN', 4]]));
    expect(result).toBeCloseTo(4 * EMISSION_FACTORS.METAL_CAN);
  });

  it('sums emissions across mixed categories', () => {
    const result = estimateCo2SavedKg(
      new Map([
        ['PLASTIC_PET', 10],
        ['GLASS', 20],
        ['ELECTRONICS', 2],
      ]),
    );
    const expected =
      10 * EMISSION_FACTORS.PLASTIC_PET +
      20 * EMISSION_FACTORS.GLASS +
      2 * EMISSION_FACTORS.ELECTRONICS;
    expect(result).toBeCloseTo(expected);
  });

  it('returns zero for an empty weight map', () => {
    expect(estimateCo2SavedKg(new Map())).toBe(0);
  });

  it('ignores zero-weight categories', () => {
    expect(estimateCo2SavedKg(new Map([['PLASTIC_PET', 0]]))).toBe(0);
  });

  it('clamps negative weights to zero so bad input cannot subtract', () => {
    const result = estimateCo2SavedKg(
      new Map([
        ['PLASTIC_PET', -100],
        ['PAPER', 5],
      ]),
    );
    expect(result).toBeCloseTo(5 * EMISSION_FACTORS.PAPER);
  });

  it('uses the default factor for unmapped category codes', () => {
    const result = estimateCo2SavedKg(new Map([['UNKNOWN', 3]]));
    expect(result).toBeCloseTo(3 * getEmissionFactor('UNKNOWN'));
  });

  it('produces a positive estimate for every mapped taxonomy code', () => {
    for (const entry of Object.values(WASTE_AI_TAXONOMY)) {
      if (entry.db_category_code === null) {
        continue;
      }
      const result = estimateCo2SavedKg(new Map([[entry.db_category_code, 1]]));
      expect(result).toBeGreaterThan(0);
    }
  });
});
