import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CollectorAvailableWasteFiltersDto } from '../waste-listings/dto/collector-available-waste-filters.dto';
import { ListingService } from '../waste-listings/listing.service';
import { CollectorService } from './collector.service';
import { SetHandledCategoriesDto } from './dto/set-handled-category.dto';

@Controller('collector')
@Roles('collector')
export class CollectorController {
  constructor(
    private readonly collectorService: CollectorService,
    private readonly listingService: ListingService,
  ) {}

  @Get('available-waste')
  getAvailableWaste(
    @CurrentUser() user: AuthUser,
    @Query() filters: CollectorAvailableWasteFiltersDto,
  ) {
    return this.listingService.getAvailableWasteForCollector(user.id, {
      city: filters.city,
      categoryId: filters.category_id,
      latitude: filters.lat,
      longitude: filters.lng,
      radiusKm: filters.radius_km,
      page: filters.page,
      limit: filters.limit,
    });
  }

  @Get('handled-categories')
  getHandledCategories(@CurrentUser() user: AuthUser) {
    return this.collectorService.getHandledCategories(user.id);
  }

  @Post('handled-categories')
  setHandledCategories(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetHandledCategoriesDto,
  ) {
    return this.collectorService.setHandledCategories(user.id, dto.categories);
  }

  @Delete('handled-categories/:categoryId')
  async removeHandledCategory(
    @CurrentUser() user: AuthUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    await this.collectorService.removeHandledCategory(user.id, categoryId);
    return null;
  }
}
