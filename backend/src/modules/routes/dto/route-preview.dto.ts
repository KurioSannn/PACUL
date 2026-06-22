import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class RoutePreviewDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  @ArrayUnique()
  listingIds!: string[];
}
