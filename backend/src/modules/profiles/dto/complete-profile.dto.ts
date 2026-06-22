import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserRole } from '../profiles.types';

export class CompleteProfileDto {
  @ApiProperty({ enum: ['household', 'collector', 'industry'] })
  @IsIn(['household', 'collector', 'industry'])
  role!: UserRole;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ format: 'uri' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ValidateIf(
    (dto: CompleteProfileDto) =>
      dto.role === 'household' || dto.role === 'industry',
  )
  @IsOptional()
  @IsString()
  address?: string;

  @ValidateIf(
    (dto: CompleteProfileDto) =>
      dto.role === 'household' || dto.role === 'industry',
  )
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ValidateIf(
    (dto: CompleteProfileDto) =>
      dto.role === 'household' || dto.role === 'industry',
  )
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'household')
  @IsOptional()
  @IsString()
  district?: string;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'household')
  @IsOptional()
  @IsString()
  city?: string;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'household')
  @IsOptional()
  @IsString()
  province?: string;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'collector')
  @IsOptional()
  @IsString()
  businessName?: string;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'collector')
  @IsOptional()
  @IsString()
  serviceAreaDescription?: string;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'collector')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  baseLatitude?: number;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'collector')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  baseLongitude?: number;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'collector')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vehicleCapacityKg?: number;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'industry')
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ValidateIf((dto: CompleteProfileDto) => dto.role === 'industry')
  @IsOptional()
  @IsString()
  industryType?: string;
}
