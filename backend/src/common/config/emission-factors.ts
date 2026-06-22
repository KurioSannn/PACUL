/**
 * Estimated kg of CO2-equivalent avoided per kg of recycled material, keyed by
 * waste category code (`db_category_code` from the AI taxonomy).
 *
 * IMPORTANT: these are SIMULATED demo values chosen for the hackathon MVP. They
 * are NOT peer-reviewed life-cycle assessment figures and must not be presented
 * as authoritative carbon accounting. Tune freely; downstream code reads only
 * through `getEmissionFactor` / `estimateCo2SavedKg`.
 */
export const EMISSION_FACTORS: Record<string, number> = {
  PLASTIC_PET: 1.5,
  PLASTIC_OTHER: 1.2,
  PAPER: 0.9,
  METAL_CAN: 2.0,
  GLASS: 0.3,
  ELECTRONICS: 3.0,
  ORGANIC: 0.5,
  TEXTILE: 1.0,
};

/** Fallback factor for materials without a mapped category code. */
export const DEFAULT_EMISSION_FACTOR = 1.0;

export function getEmissionFactor(
  categoryCode: string | null | undefined,
): number {
  if (!categoryCode) {
    return DEFAULT_EMISSION_FACTOR;
  }

  return EMISSION_FACTORS[categoryCode] ?? DEFAULT_EMISSION_FACTOR;
}

/**
 * Sums estimated CO2 saved across category weights. Negative weights are
 * clamped to zero so bad input cannot subtract from the total.
 */
export function estimateCo2SavedKg(
  weightsByCategoryCode: Map<string, number>,
): number {
  let total = 0;

  for (const [code, weightKg] of weightsByCategoryCode) {
    total += Math.max(weightKg, 0) * getEmissionFactor(code);
  }

  return total;
}
