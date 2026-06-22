import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import { CostEstimationService } from './cost-estimation.service';

describe('CostEstimationService', () => {
  let service: CostEstimationService;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: keyof EnvironmentVariables) => {
        const values: Partial<Record<keyof EnvironmentVariables, number>> = {
          ROUTE_BASE_FEE: 5000,
          ROUTE_COST_PER_KM: 2000,
          ROUTE_HANDLING_COST_PER_KG: 300,
        };

        return values[key];
      }),
    } as unknown as ConfigService<EnvironmentVariables, true>;

    service = new CostEstimationService(configService);
  });

  it('charges only base fee for zero distance and weight', () => {
    const result = service.estimatePickupCost({
      totalDistanceKm: 0,
      totalWeightKg: 0,
      stopCount: 1,
    });

    expect(result.baseFee).toBe(5000);
    expect(result.distanceCost).toBe(0);
    expect(result.handlingCost).toBe(0);
    expect(result.totalCost).toBe(5000);
  });

  it('adds distance cost for 10km', () => {
    const result = service.estimatePickupCost({
      totalDistanceKm: 10,
      totalWeightKg: 0,
      stopCount: 1,
    });

    expect(result.distanceCost).toBe(20000);
    expect(result.totalCost).toBe(25000);
  });

  it('adds handling cost for 5kg', () => {
    const result = service.estimatePickupCost({
      totalDistanceKm: 0,
      totalWeightKg: 5,
      stopCount: 1,
    });

    expect(result.handlingCost).toBe(1500);
    expect(result.totalCost).toBe(6500);
  });

  it('combines base, distance, and handling costs', () => {
    const result = service.estimatePickupCost({
      totalDistanceKm: 10,
      totalWeightKg: 5,
      stopCount: 3,
    });

    expect(result.totalCost).toBe(26500);
    expect(result.configUsed).toEqual({
      baseFee: 5000,
      costPerKm: 2000,
      handlingCostPerKg: 300,
    });
  });

  it('never returns a total below the base fee', () => {
    const result = service.estimatePickupCost({
      totalDistanceKm: 0,
      totalWeightKg: 0,
      stopCount: 2,
    });

    expect(result.totalCost).toBeGreaterThanOrEqual(result.baseFee);
  });

  it('keeps breakdown components aligned with cost fields', () => {
    const result = service.estimatePickupCost({
      totalDistanceKm: 10,
      totalWeightKg: 5,
      stopCount: 2,
    });

    expect(result.breakdown.baseFee).toBe(result.baseFee);
    expect(result.breakdown.distanceFee).toBe(result.distanceCost);
    expect(result.breakdown.handlingFee).toBe(result.handlingCost);
    expect(
      result.breakdown.baseFee +
        result.breakdown.distanceFee +
        result.breakdown.handlingFee,
    ).toBe(result.totalCost);
  });

  it('rounds total cost up to the nearest 100 IDR', () => {
    const configService = {
      get: jest.fn((key: keyof EnvironmentVariables) => {
        const values: Partial<Record<keyof EnvironmentVariables, number>> = {
          ROUTE_BASE_FEE: 5000,
          ROUTE_COST_PER_KM: 333,
          ROUTE_HANDLING_COST_PER_KG: 300,
        };

        return values[key];
      }),
    } as unknown as ConfigService<EnvironmentVariables, true>;

    const customService = new CostEstimationService(configService);
    const result = customService.estimatePickupCost({
      totalDistanceKm: 1,
      totalWeightKg: 1,
      stopCount: 1,
    });

    expect(result.distanceCost + result.handlingCost + result.baseFee).toBe(
      5633,
    );
    expect(result.totalCost).toBe(5700);
  });
});
