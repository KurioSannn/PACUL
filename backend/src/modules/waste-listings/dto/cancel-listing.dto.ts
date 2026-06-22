import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelListingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
