import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { MaterialBatchStatus } from '../materials.types';

const MATERIAL_BATCH_STATUSES: MaterialBatchStatus[] = [
  'draft',
  'available',
  'ordered',
  'negotiating',
  'sold',
  'unavailable',
];

export class MaterialBatchFiltersDto {
  @IsOptional()
  @IsIn(MATERIAL_BATCH_STATUSES)
  status?: MaterialBatchStatus;
}

export class UpdateMaterialBatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_per_kg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_order_kg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location_address?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string | null;

  @IsOptional()
  @IsString()
  available_from?: string | null;

  @IsOptional()
  @IsString()
  available_until?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
