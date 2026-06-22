import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize';

export class OverrideClassificationDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @SanitizeText({ maxLength: 500 })
  @MaxLength(500)
  reason?: string;
}
