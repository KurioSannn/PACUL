import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ClientTopKEntryDto {
  @IsString()
  @IsNotEmpty()
  class!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsOptional()
  @IsString()
  label?: string;
}

export class ClassifyWasteClientDto {
  @IsString()
  @IsNotEmpty()
  imagePath!: string;

  @IsString()
  @IsNotEmpty()
  top_class!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsString()
  @IsNotEmpty()
  model_version!: string;

  @IsNumber()
  @Min(0)
  inference_time_ms!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientTopKEntryDto)
  top_k!: ClientTopKEntryDto[];
}
