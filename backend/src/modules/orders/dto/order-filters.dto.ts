import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { OrderStatus } from '../orders.types';

const ORDER_STATUSES: OrderStatus[] = [
  'created',
  'negotiating',
  'accepted',
  'rejected',
  'cancelled',
  'completed',
];

export class OrderFiltersDto {
  @ApiPropertyOptional({
    enum: ORDER_STATUSES,
    description: 'Filter by order status',
  })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;
}
