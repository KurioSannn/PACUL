import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOfferDto {
  @ApiProperty({
    example: 3200,
    minimum: 0.001,
    description: 'Offered price per kg in IDR',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  price_per_kg!: number;

  @ApiProperty({
    example: 80,
    minimum: 0.001,
    description: 'Offered weight in kg',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  weight_kg!: number;
}
