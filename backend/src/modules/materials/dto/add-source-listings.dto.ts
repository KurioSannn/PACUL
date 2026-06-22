import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SourceListingInputDto {
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  weightKg!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AddSourceListingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SourceListingInputDto)
  sources!: SourceListingInputDto[];
}
