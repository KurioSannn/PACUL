import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { PickupClaimStatus } from '../pickup-claim.types';

const PICKUP_CLAIM_STATUSES: PickupClaimStatus[] = [
  'claimed',
  'pickup_planned',
  'picked_up',
  'cancelled',
];

export class UpdatePickupClaimStatusDto {
  @IsIn(PICKUP_CLAIM_STATUSES)
  status!: PickupClaimStatus;

  @IsOptional()
  @IsISO8601()
  pickup_scheduled_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancel_reason?: string;
}
