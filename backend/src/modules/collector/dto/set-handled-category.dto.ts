import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class SetHandledCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceOfferedPerKg?: number;
}

export class SetHandledCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetHandledCategoryDto)
  categories!: SetHandledCategoryDto[];
}
