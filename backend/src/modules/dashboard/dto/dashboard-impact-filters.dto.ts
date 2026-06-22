import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardImpactFiltersDto {
  @ApiPropertyOptional({ format: 'date', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 'Surabaya' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Jawa Timur' })
  @IsOptional()
  @IsString()
  province?: string;
}
