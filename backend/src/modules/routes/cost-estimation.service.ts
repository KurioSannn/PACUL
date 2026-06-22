import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../common/config/env.validation';

export interface CostEstimationInput {
  totalDistanceKm: number;
  totalWeightKg: number;
  stopCount: number;
}

export interface CostEstimationBreakdown {
  baseFee: number;
  distanceFee: number;
  handlingFee: number;
}

export interface CostEstimationConfigUsed {
  baseFee: number;
  costPerKm: number;
  handlingCostPerKg: number;
}

export interface CostEstimationResult {
  baseFee: number;
  distanceCost: number;
  handlingCost: number;
  totalCost: number;
  breakdown: CostEstimationBreakdown;
  configUsed: CostEstimationConfigUsed;
}

@Injectable()
export class CostEstimationService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  estimatePickupCost(input: CostEstimationInput): CostEstimationResult {
    const configUsed = this.getConfigUsed();
    const baseFee = configUsed.baseFee;
    const distanceCost = Math.round(
      Math.max(input.totalDistanceKm, 0) * configUsed.costPerKm,
    );
    const handlingCost = Math.round(
      Math.max(input.totalWeightKg, 0) * configUsed.handlingCostPerKg,
    );
    const subtotal = baseFee + distanceCost + handlingCost;
    const totalCost = roundUpToNearest100(subtotal);

    return {
      baseFee,
      distanceCost,
      handlingCost,
      totalCost,
      breakdown: {
        baseFee,
        distanceFee: distanceCost,
        handlingFee: handlingCost,
      },
      configUsed,
    };
  }

  private getConfigUsed(): CostEstimationConfigUsed {
    return {
      baseFee:
        this.configService.get('ROUTE_BASE_FEE', { infer: true }) ?? 5000,
      costPerKm:
        this.configService.get('ROUTE_COST_PER_KM', { infer: true }) ?? 2000,
      handlingCostPerKg:
        this.configService.get('ROUTE_HANDLING_COST_PER_KG', { infer: true }) ??
        300,
    };
  }
}

function roundUpToNearest100(amount: number): number {
  return Math.ceil(amount / 100) * 100;
}
