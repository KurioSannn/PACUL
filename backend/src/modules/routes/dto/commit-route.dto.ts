import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RoutePreviewDto } from './route-preview.dto';

export class CommitRouteDto extends RoutePreviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
