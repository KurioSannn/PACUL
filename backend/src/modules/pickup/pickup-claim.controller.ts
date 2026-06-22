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
import { CreatePickupClaimDto } from './dto/create-pickup-claim.dto';
import { PickupClaimFiltersDto } from './dto/pickup-claim-filters.dto';
import { UpdatePickupClaimStatusDto } from './dto/update-pickup-claim-status.dto';
import { PickupClaimService } from './pickup-claim.service';

@Controller('collector/pickup-claims')
@Roles('collector')
export class PickupClaimController {
  constructor(private readonly pickupClaimService: PickupClaimService) {}

  @Post()
  claimListing(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePickupClaimDto,
  ) {
    return this.pickupClaimService.claimListing(user.id, dto.listingId);
  }

  @Get()
  getCollectorClaims(
    @CurrentUser() user: AuthUser,
    @Query() filters: PickupClaimFiltersDto,
  ) {
    return this.pickupClaimService.getCollectorClaims(user.id, filters.status);
  }

  @Patch(':id/status')
  updateClaimStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePickupClaimStatusDto,
  ) {
    return this.pickupClaimService.updateClaimStatus(id, user.id, dto.status, {
      pickup_scheduled_at: dto.pickup_scheduled_at,
      notes: dto.notes,
      cancel_reason: dto.cancel_reason,
    });
  }
}
