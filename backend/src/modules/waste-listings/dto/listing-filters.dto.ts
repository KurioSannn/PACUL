import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import type { WasteListingStatus } from '../waste-listings.types';

const WASTE_LISTING_STATUSES: WasteListingStatus[] = [
  'draft',
  'available',
  'claimed',
  'pickup_planned',
  'picked_up',
  'sorting',
  'sorted',
  'converted_to_material',
  'cancelled',
];

export class ListingFiltersDto {
  @IsOptional()
  @IsIn(WASTE_LISTING_STATUSES)
  status?: WasteListingStatus;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
