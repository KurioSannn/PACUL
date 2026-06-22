import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCollectorProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  serviceAreaDescription?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  baseLatitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  baseLongitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vehicleCapacityKg?: number;
}
