import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { TraceabilityService } from './traceability.service';

@ApiTags('traceability')
@ApiBearerAuth('bearer')
@Controller('traceability')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('material/:batchId')
  @Roles('collector', 'industry')
  @ApiOperation({ summary: 'Get PACUL Track timeline for a material batch' })
  getMaterialTimeline(
    @CurrentUser() user: AuthUser,
    @Param('batchId', ParseUUIDPipe) batchId: string,
  ) {
    return this.traceabilityService.getMaterialTrackTimeline(
      batchId,
      user.id,
      user.role,
    );
  }

  @Get('waste/:listingId')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({ summary: 'Get PACUL Track journey for a waste listing' })
  getWasteListingJourney(
    @CurrentUser() user: AuthUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.traceabilityService.getWasteTrackJourney(
      listingId,
      user.id,
      user.role,
    );
  }

  @Get('order/:orderId')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Get PACUL Track timeline for an order' })
  getOrderTimeline(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.traceabilityService.getOrderTrackTimeline(
      orderId,
      user.id,
      user.role,
    );
  }
}
