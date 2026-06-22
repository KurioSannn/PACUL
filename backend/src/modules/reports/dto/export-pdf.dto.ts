import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportPdfDto {
  @ApiPropertyOptional({
    format: 'date-time',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from_date?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  to_date?: string;

  @ApiPropertyOptional({ maxLength: 120, example: 'Surabaya' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;
}
