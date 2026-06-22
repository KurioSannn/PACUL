import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeText } from '../../../common/utils/sanitize';

export class CancelNegotiationDto {
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Optional cancellation reason',
  })
  @IsOptional()
  @IsString()
  @SanitizeText({ maxLength: 1000 })
  @MaxLength(1000)
  reason?: string;
}
