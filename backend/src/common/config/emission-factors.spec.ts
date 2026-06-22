import { WASTE_AI_TAXONOMY } from '../../modules/ai/ai.taxonomy';
import {
  DEFAULT_EMISSION_FACTOR,
  EMISSION_FACTORS,
  getEmissionFactor,
} from './emission-factors';

describe('emission factors', () => {
  const taxonomyCodes = Object.values(WASTE_AI_TAXONOMY)
    .map((entry) => entry.db_category_code)
    .filter((code): code is string => code !== null);

  it('defines a factor for every mapped taxonomy category code', () => {
    for (const code of taxonomyCodes) {
      expect(EMISSION_FACTORS[code]).toBeDefined();
    }
  });

  it('uses only positive factor values', () => {
    for (const factor of Object.values(EMISSION_FACTORS)) {
      expect(factor).toBeGreaterThan(0);
    }
  });

  it('treats GLASS as the lowest-impact mapped category', () => {
    const lowest = Math.min(...Object.values(EMISSION_FACTORS));
    expect(EMISSION_FACTORS.GLASS).toBe(lowest);
  });

  it('treats ELECTRONICS as the highest-impact mapped category', () => {
    const highest = Math.max(...Object.values(EMISSION_FACTORS));
    expect(EMISSION_FACTORS.ELECTRONICS).toBe(highest);
  });

  it('falls back to the default factor for unknown or missing codes', () => {
    expect(getEmissionFactor('NOT_A_REAL_CODE')).toBe(DEFAULT_EMISSION_FACTOR);
    expect(getEmissionFactor(null)).toBe(DEFAULT_EMISSION_FACTOR);
    expect(getEmissionFactor(undefined)).toBe(DEFAULT_EMISSION_FACTOR);
  });

  it('returns the configured factor for a known code', () => {
    expect(getEmissionFactor('PLASTIC_PET')).toBe(EMISSION_FACTORS.PLASTIC_PET);
  });
});
