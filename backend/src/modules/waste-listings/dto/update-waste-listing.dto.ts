import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateWasteListingDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  classification_id?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  estimated_weight_kg?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  district?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  city?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  province?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsISO8601()
  available_from?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsISO8601()
  available_until?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagePaths?: string[];
}
