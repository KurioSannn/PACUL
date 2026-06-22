import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PickupRouteStopStatus } from '../routes.types';

const UPDATABLE_STOP_STATUSES = [
  'arrived',
  'completed',
  'skipped',
] as const satisfies readonly PickupRouteStopStatus[];

export type UpdatableStopStatus = (typeof UPDATABLE_STOP_STATUSES)[number];

export class UpdateStopStatusDto {
  @IsIn(UPDATABLE_STOP_STATUSES)
  status!: UpdatableStopStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
