import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { NegotiationService } from './negotiation.service';

@ApiTags('negotiations')
@ApiBearerAuth('bearer')
@Controller('orders')
export class OrderNegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Post(':orderId/negotiation')
  @Roles('industry')
  @ApiOperation({ summary: 'Start negotiation thread for an order' })
  startNegotiation(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.negotiationService.startNegotiation(orderId, user.id);
  }

  @Get(':orderId/negotiation/history')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Get negotiation history for an order' })
  getNegotiationHistory(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.negotiationService.getNegotiationHistory(orderId, user.id);
  }
}
