import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { RatingContextType } from '../ratings.types';

export class SubmitRatingDto {
  @IsUUID()
  @IsNotEmpty()
  rateeId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewText?: string;

  @IsIn(['pickup', 'transaction'])
  contextType!: RatingContextType;

  @IsUUID()
  @IsNotEmpty()
  contextId!: string;
}
