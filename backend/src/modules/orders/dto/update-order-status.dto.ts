import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeText } from '../../../common/utils/sanitize';
import type { OrderStatus } from '../orders.types';

const UPDATABLE_ORDER_STATUSES: OrderStatus[] = [
  'negotiating',
  'accepted',
  'rejected',
  'cancelled',
  'completed',
];

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: UPDATABLE_ORDER_STATUSES,
    description: 'Target order status',
  })
  @IsIn(UPDATABLE_ORDER_STATUSES)
  status!: OrderStatus;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Required when cancelling',
  })
  @IsOptional()
  @IsString()
  @SanitizeText({ maxLength: 1000 })
  @MaxLength(1000)
  cancel_reason?: string;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Final agreed price per kg in IDR',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  final_price_per_kg?: number;

  @ApiPropertyOptional({
    minimum: 0.001,
    description: 'Final agreed weight in kg',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  final_weight_kg?: number;
}
