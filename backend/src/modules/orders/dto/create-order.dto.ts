import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeText } from '../../../common/utils/sanitize';

export class CreateOrderDto {
  @ApiProperty({ format: 'uuid', description: 'Material batch to purchase' })
  @IsUUID()
  @IsNotEmpty()
  batchId!: string;

  @ApiProperty({
    example: 100,
    minimum: 0.001,
    description: 'Requested weight in kg',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  requested_weight_kg!: number;

  @ApiProperty({
    example: 3500,
    minimum: 0,
    description: 'Offered price per kg in IDR',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offered_price_per_kg!: number;

  @ApiPropertyOptional({ maxLength: 1000, description: 'Optional order notes' })
  @IsOptional()
  @IsString()
  @SanitizeText({ maxLength: 1000 })
  @MaxLength(1000)
  notes?: string;
}
