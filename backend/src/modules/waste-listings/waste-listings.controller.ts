import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateWasteListingDto } from './dto/create-waste-listing.dto';
import { CancelListingDto } from './dto/cancel-listing.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { UpdateWasteListingDto } from './dto/update-waste-listing.dto';
import { ListingService } from './listing.service';

@Controller('waste-listings')
export class WasteListingsController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  @Roles('household')
  createListing(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWasteListingDto,
  ) {
    return this.listingService.createListing(user.id, dto);
  }

  @Get()
  @Roles('household', 'collector')
  listListings(
    @CurrentUser() user: AuthUser,
    @Query() filters: ListingFiltersDto,
  ) {
    return this.listingService.listListings(filters, user.id, user.role);
  }

  @Post(':id/publish')
  @Roles('household')
  publishListing(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listingService.publishListing(id, user.id);
  }

  @Post(':id/cancel')
  @Roles('household', 'collector')
  cancelListing(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelListingDto,
  ) {
    return this.listingService.cancelListing(
      id,
      user.id,
      user.role,
      dto.reason,
    );
  }

  @Get(':id')
  getListingById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listingService.getListingById(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles('household')
  updateListing(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWasteListingDto,
  ) {
    return this.listingService.updateListing(id, user.id, dto);
  }
}
