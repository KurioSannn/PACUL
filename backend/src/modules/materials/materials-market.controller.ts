import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { PublishToMarketDto } from './dto/publish-to-market.dto';
import { UpdateMarketListingDto } from './dto/update-market-listing.dto';
import { MaterialBatchService } from './material-batch.service';

@Controller('materials')
@Roles('collector')
export class MaterialsMarketController {
  constructor(private readonly materialBatchService: MaterialBatchService) {}

  @Post(':batchId/publish-to-market')
  publishToMarket(
    @CurrentUser() user: AuthUser,
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto: PublishToMarketDto,
  ) {
    return this.materialBatchService.publishToMarketplace(
      batchId,
      user.id,
      dto,
    );
  }

  @Patch('market/:listingId')
  updateMarketListing(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: UpdateMarketListingDto,
  ) {
    return this.materialBatchService.updateMarketListing(
      listingId,
      user.id,
      dto,
    );
  }

  @Post('market/:listingId/withdraw')
  withdrawMarketListing(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.materialBatchService.withdrawMarketListing(listingId, user.id);
  }
}
