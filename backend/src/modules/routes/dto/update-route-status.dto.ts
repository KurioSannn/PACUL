import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PickupRouteStatus } from '../routes.types';

const UPDATABLE_ROUTE_STATUSES = [
  'ongoing',
  'completed',
  'cancelled',
] as const satisfies readonly PickupRouteStatus[];

export type UpdatableRouteStatus = (typeof UPDATABLE_ROUTE_STATUSES)[number];

export class UpdateRouteStatusDto {
  @IsIn(UPDATABLE_ROUTE_STATUSES)
  status!: UpdatableRouteStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancel_reason?: string;
}
