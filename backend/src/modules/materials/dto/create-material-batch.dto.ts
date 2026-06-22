import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaterialBatchDto {
  @IsUUID()
  @IsNotEmpty()
  category_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_per_kg!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_order_kg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location_address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string;

  @IsOptional()
  @IsString()
  available_from?: string;

  @IsOptional()
  @IsString()
  available_until?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  sourceListingIds?: string[];
}
