import { IsIn, IsOptional } from 'class-validator';
import type { PickupClaimStatus } from '../pickup-claim.types';

const PICKUP_CLAIM_STATUSES: PickupClaimStatus[] = [
  'claimed',
  'pickup_planned',
  'picked_up',
  'cancelled',
];

export class PickupClaimFiltersDto {
  @IsOptional()
  @IsIn(PICKUP_CLAIM_STATUSES)
  status?: PickupClaimStatus;
}
