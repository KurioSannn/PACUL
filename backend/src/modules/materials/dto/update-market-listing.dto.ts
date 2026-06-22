import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { MaterialQualityGrade } from '../materials.types';

const QUALITY_GRADES: MaterialQualityGrade[] = ['A', 'B', 'C'];

export class UpdateMarketListingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(QUALITY_GRADES)
  quality_grade?: MaterialQualityGrade;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  asking_price_per_kg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  available_weight_kg?: number;
}
